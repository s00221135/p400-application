import json
import boto3
import uuid

dynamodb = boto3.resource("dynamodb")
households_table = dynamodb.Table("Households")  # Use your actual table name

def lambda_handler(event, context):
    # Basic CORS
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    }

    # Handle OPTIONS (preflight)
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    body = json.loads(event.get("body", "{}"))

    # Expect:
    # {
    #   "HouseholdID": "...",
    #   "RequestingUserID": "...",
    #   "Action": "grant"|"revoke"|"regenerate"|"rename",
    #   "TargetUserID": "..."  (if grant/revoke)
    #   "NewName": "..."       (if rename)
    # }

    household_id = body.get("HouseholdID")
    requesting_user_id = body.get("RequestingUserID")
    action = body.get("Action")
    target_user_id = body.get("TargetUserID")  # only for grant/revoke
    new_name = body.get("NewName")             # only for rename

    # Validate
    if not (household_id and requesting_user_id and action):
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"message": "Missing HouseholdID, RequestingUserID, or Action"})
        }

    # Retrieve household record from 'Households' table
    res = households_table.get_item(Key={"HouseholdID": household_id})
    household = res.get("Item")
    if not household:
        return {
            "statusCode": 404,
            "headers": cors_headers,
            "body": json.dumps({"message": "Household not found"})
        }

    # Check if requestor is admin
    admins = household.get("Admins", [])
    if requesting_user_id not in admins:
        return {
            "statusCode": 403,
            "headers": cors_headers,
            "body": json.dumps({"message": "You are not an admin of this household"})
        }

    # Now handle each action
    if action == "grant":
        if not target_user_id:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"message": "TargetUserID required for 'grant'"})
            }
        members = household.get("Members", [])
        if target_user_id not in members:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"message": "Target user is not a member of the household"})
            }
        if target_user_id in admins:
            message = "Target user is already an admin"
        else:
            admins.append(target_user_id)
            households_table.update_item(
                Key={"HouseholdID": household_id},
                UpdateExpression="SET Admins = :a",
                ExpressionAttributeValues={":a": admins}
            )
            message = "Admin privileges granted"

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"message": message, "Admins": admins})
        }

    elif action == "revoke":
        if not target_user_id:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"message": "TargetUserID required for 'revoke'"})
            }
        if target_user_id in admins:
            admins.remove(target_user_id)
            households_table.update_item(
                Key={"HouseholdID": household_id},
                UpdateExpression="SET Admins = :a",
                ExpressionAttributeValues={":a": admins}
            )
            message = "Admin privileges revoked"
        else:
            message = "Target user was not an admin"

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"message": message, "Admins": admins})
        }

    elif action == "regenerate":
        new_join_code = str(uuid.uuid4().int)[:6]
        households_table.update_item(
            Key={"HouseholdID": household_id},
            UpdateExpression="SET JoinCode = :jc",
            ExpressionAttributeValues={":jc": new_join_code}
        )
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({
                "message": "Join code regenerated",
                "NewJoinCode": new_join_code
            })
        }

    elif action == "rename":
        if not new_name:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"message": "NewName is required for rename"})
            }
        # Update the 'Name' field in the Households table
        households_table.update_item(
            Key={"HouseholdID": household_id},
            UpdateExpression="SET #n = :val_name",
            ExpressionAttributeNames={"#n": "Name"},
            ExpressionAttributeValues={":val_name": new_name}
        )
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({
                "message": "Household name updated",
                "NewName": new_name
            })
        }

    else:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"message": "Action must be grant, revoke, regenerate, or rename"})
        }
