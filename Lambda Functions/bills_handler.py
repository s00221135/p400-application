import os
import json
import uuid
import base64
from decimal import Decimal, InvalidOperation
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
s3_client = boto3.client('s3', region_name='eu-west-1')

TABLE_NAME = os.environ.get('BILLS_TABLE', 'Bills')
BILLS_BUCKET = os.environ.get('BILLS_BUCKET', 'my-bills-bucket-flatchat')
table = dynamodb.Table(TABLE_NAME)

def upload_image_to_s3(image_data, content_type):
    """
    Decodes the base64-encoded image and uploads it to S3.
    Returns the S3 URL if successful.
    """
    try:
        print("Uploading image with content type:", content_type)
        print("Image data (first 100 chars):", image_data[:100])
        
        decoded_image = base64.b64decode(image_data)

        ext = "jpg" if "jpeg" in content_type.lower() else "png"
        key = f"bills/{uuid.uuid4()}.{ext}"

        s3_client.put_object(
            Bucket=BILLS_BUCKET,
            Key=key,
            Body=decoded_image,
            ContentType=content_type
        )

        return f"https://{BILLS_BUCKET}.s3.eu-west-1.amazonaws.com/{key}"
    
    except ClientError as e:
        print("Error uploading image:", e)
        return None

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    
    try:
        if "body" in event:
            payload = json.loads(event.get("body") or "{}")
        else:
            payload = event

        method = event.get("httpMethod", "")
        path_params = event.get("pathParameters") or {}
        query_params = event.get("queryStringParameters") or {}
        bill_id = path_params.get("id")

        household_id = query_params.get("HouseholdID") or payload.get("HouseholdID")
        if not household_id:
            return respond(400, {"message": "Missing HouseholdID"})

        if method == "GET":
            if bill_id:
                result = table.get_item(Key={"HouseholdID": household_id, "BillID": bill_id})
                return respond(200, result.get("Item", {})) if "Item" in result else respond(404, {"message": "Bill not found"})
            else:
                result = table.query(KeyConditionExpression=Key("HouseholdID").eq(household_id))
                return respond(200, {"bills": result.get("Items", [])})

        elif method == "POST":
            data = payload
            bill_id = str(uuid.uuid4())
            data["BillID"] = bill_id
            data["HouseholdID"] = household_id

            if "ImageData" in data and "ImageContentType" in data:
                image_url = upload_image_to_s3(data["ImageData"], data["ImageContentType"])
                if image_url:
                    data["ImageURL"] = image_url
                data.pop("ImageData", None)
                data.pop("ImageContentType", None)

            data["Members"] = data.get("Members", [])

            if "Splits" not in data:
                try:
                    total_amount = Decimal(str(data.get("TotalAmount", "0")))
                except (InvalidOperation, ValueError):
                    return respond(400, {"message": "Invalid TotalAmount value"})
                if data["Members"] and total_amount > 0:
                    share = (total_amount / Decimal(len(data["Members"]))).quantize(Decimal("0.01"))
                    data["Splits"] = [{"UserID": user, "Share": share, "Paid": False} for user in data["Members"]]

            data["PaidMembers"] = data.get("PaidMembers", [])

            table.put_item(Item=data)
            return respond(201, data)

        elif method == "PUT":
            if not bill_id:
                return respond(400, {"message": "Missing Bill ID in path"})

            data = payload
            data["BillID"] = bill_id
            data["HouseholdID"] = household_id

            existing_item = table.get_item(Key={"HouseholdID": household_id, "BillID": bill_id}).get("Item", {})

            if "ImageData" in data and "ImageContentType" in data:
                image_url = upload_image_to_s3(data["ImageData"], data["ImageContentType"])
                if image_url:
                    data["ImageURL"] = image_url
                data.pop("ImageData", None)
                data.pop("ImageContentType", None)

            data["Members"] = data.get("Members", existing_item.get("Members", []))
            data["PaidMembers"] = data.get("PaidMembers", existing_item.get("PaidMembers", []))

            if "TotalAmount" in data:
                try:
                    data["TotalAmount"] = str(Decimal(str(data["TotalAmount"])))
                except (InvalidOperation, ValueError):
                    return respond(400, {"message": "Invalid TotalAmount value"})
            if "Splits" in data:
                for split in data["Splits"]:
                    if "Share" in split:
                        try:
                            split["Share"] = Decimal(str(split["Share"]))
                        except (InvalidOperation, ValueError):
                            return respond(400, {"message": "Invalid Share value in splits"})
            
            table.put_item(Item=data)
            return respond(200, data)

        elif method == "DELETE":
            if not bill_id:
                return respond(400, {"message": "Missing Bill ID in path"})
            table.delete_item(Key={"HouseholdID": household_id, "BillID": bill_id})
            return respond(200, {"message": "Bill deleted"})

        else:
            return respond(405, {"message": "Method not allowed"})

    except Exception as e:
        print("Error:", e)
        return respond(500, {"message": str(e)})

def respond(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(body, default=lambda o: float(o) if isinstance(o, Decimal) else o)
    }
