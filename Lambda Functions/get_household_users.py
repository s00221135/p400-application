import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("UserDetails") 

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    try:
        qs = event.get("queryStringParameters") or {}
        household_id = qs.get("HouseholdID")
        
        if not household_id:
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Missing HouseholdID query param"})
            }
        
        scan_response = table.scan(
            FilterExpression="HouseholdID = :hid",
            ExpressionAttributeValues={":hid": household_id}
        )
        members = scan_response.get("Items", [])
        
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"users": members}, default=lambda o: float(o) if isinstance(o, Decimal) else o)
        }
        
    except Exception as e:
        print("Error:", e)
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }
