import json
import uuid
import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime

dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
TABLE_NAME = "HouseholdNotices"
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    method = event.get("httpMethod", "")
    path_parameters = event.get("pathParameters") or {}
    query_params = event.get("queryStringParameters") or {}
    notice_id = path_parameters.get("id")

    resource_path = event.get("resource", "")

    household_id = query_params.get("HouseholdID")
    if not household_id:
        try:
            body_data = json.loads(event.get("body") or "{}")
            household_id = body_data.get("HouseholdID")
        except Exception as e:
            print("Error parsing body for HouseholdID:", e)

    if not household_id:
        return respond(400, {"message": "Missing HouseholdID"})

    try:
        if method == "GET":
            response = table.query(
                KeyConditionExpression=Key('HouseholdID').eq(household_id)
            )
            notices = response.get('Items', [])
            return respond(200, {"notices": notices})

        elif method == "POST":
            data = json.loads(event.get('body') or "{}")

            data['NoticeID'] = str(uuid.uuid4())
            data['HouseholdID'] = household_id
            
            data['CreatedAt'] = datetime.utcnow().isoformat() + "Z"

            table.put_item(Item=data)
            return respond(201, data)

        elif method == "PUT":
            if not notice_id:
                return respond(400, {"message": "Missing NoticeID in path"})

            data = json.loads(event.get("body") or "{}")

            data['HouseholdID'] = household_id
            data['NoticeID'] = notice_id

            existing_item = table.get_item(
                Key={"HouseholdID": household_id, "NoticeID": notice_id}
            ).get("Item")

            if not existing_item:
                return respond(404, {"message": "Notice not found"})

            if "CreatedAt" not in data:
                data["CreatedAt"] = existing_item.get("CreatedAt", datetime.utcnow().isoformat() + "Z")

            table.put_item(Item=data)
            return respond(200, data)

        elif method == "DELETE":
            if not notice_id:
                return respond(400, {"message": "Missing NoticeID in path"})

            existing_item = table.get_item(
                Key={"HouseholdID": household_id, "NoticeID": notice_id}
            ).get("Item")

            if not existing_item:
                return respond(404, {"message": "Notice not found"})

            table.delete_item(
                Key={
                    "HouseholdID": household_id,
                    "NoticeID": notice_id
                }
            )
            return respond(200, {"message": "Notice deleted"})

        else:
            return respond(405, {"message": f"Method not allowed: {method}"})

    except Exception as e:
        print("Error:", e)
        return respond(500, {"message": str(e)})

def respond(status_code, body):
    """Return a JSON response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",        
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
        },
        "body": json.dumps(body)
    }
