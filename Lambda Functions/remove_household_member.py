import json
import boto3

dynamodb = boto3.resource("dynamodb")
households_table = dynamodb.Table("Households")
users_table = dynamodb.Table("UserDetails")

def lambda_handler(event, context):
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST,DELETE"
    }
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    # Expect JSON: { "HouseholdID": "...", "RequestingUserID": "...", "TargetUserID": "..." }
    # The "RequestingUserID" must be an admin
    body = json.loads(event.get("body", "{}"))
    household_id = body.get("HouseholdID")
    requesting_user_id = body.get("RequestingUserID")
    target_user_id = body.get("TargetUserID")

    if not (household_id and requesting_user_id and target_user_id):
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"message": "Missing required fields"})
        }

    # 1) Fetch household
    res = households_table.get_item(Key={"HouseholdID": household_id})
    household = res.get("Item")
    if not household:
        return {
            "statusCode": 404,
            "headers": cors_headers,
            "body": json.dumps({"message": "Household not found"})
        }

    admins = household.get("Admins", [])
    members = household.get("Members", [])

    # 2) Must be admin to remove someone
    if requesting_user_id not in admins:
        return {
            "statusCode": 403,
            "headers": cors_headers,
            "body": json.dumps({"message": "Not an admin of this household"})
        }

    # 3) Remove from members
    if target_user_id in members:
        members.remove(target_user_id)
    # Also remove from admins if they happened to be admin
    if target_user_id in admins:
        admins.remove(target_user_id)
        # You might want to ensure that you’re not removing the last admin, etc.

    # 4) Update the household record
    households_table.update_item(
        Key={"HouseholdID": household_id},
        UpdateExpression="SET Members = :m, Admins = :a",
        ExpressionAttributeValues={
            ":m": members,
            ":a": admins
        }
    )

    # 5) Also set that user’s HouseholdID to None
    users_table.update_item(
        Key={"UserID": target_user_id},
        UpdateExpression="SET HouseholdID = :nullVal",
        ExpressionAttributeValues={":nullVal": None}
    )

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({
            "message": f"User {target_user_id} removed from household {household_id}"
        })
    }
