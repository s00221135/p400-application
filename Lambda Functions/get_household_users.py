import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("UserDetails")  # Ensure this is your correct table name

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    try:
        # Parse query parameters
        qs = event.get("queryStringParameters") or {}
        household_id = qs.get("HouseholdID")
        
        if not household_id:
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Missing HouseholdID query param"})
            }
        
        # Scan for all users with the specified HouseholdID
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
