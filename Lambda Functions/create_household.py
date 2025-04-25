import json
import boto3
import uuid
import datetime

dynamodb = boto3.resource("dynamodb")
households_table = dynamodb.Table("Households")
users_table = dynamodb.Table("UserDetails")

def lambda_handler(event, context):
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    body = json.loads(event.get("body", "{}"))

    household_name = body.get("HouseholdName")
    if not household_name:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"message": "HouseholdName is required"})
        }

    user_id = body.get("UserID")
    household_id = str(uuid.uuid4())[:8]
    join_code = str(uuid.uuid4().int)[:6]
    created_at = datetime.datetime.utcnow().isoformat()

    # New: store "Admins" in a set or list
    # If user_id is provided, that user becomes the first admin
    admins = []
    members = []

    if user_id:
        admins = [user_id]
        members = [user_id]

    item = {
        "HouseholdID": household_id,
        "Name": household_name,
        "JoinCode": join_code,
        "CreatedAt": created_at,
        "Admins": admins,   # store the array of admin IDs
        "Members": members
    }

    # Insert into Households
    households_table.put_item(Item=item)

    # Also set the user's HouseholdID if a user was provided
    if user_id:
        users_table.update_item(
            Key={"UserID": user_id},
            UpdateExpression="SET HouseholdID = :hid",
            ExpressionAttributeValues={":hid": household_id}
        )

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({
            "message": "Household created successfully",
            "HouseholdID": household_id,
            "JoinCode": join_code
        })
    }
