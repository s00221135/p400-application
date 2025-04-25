import json
import boto3

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
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": ""
        }
    
    print("Received event:", json.dumps(event))
    body = json.loads(event.get("body", "{}"))
    
    join_code = body.get("JoinCode")
    user_id = body.get("UserID")
    household_id = body.get("HouseholdID")

    if not user_id:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"message": "Missing UserID"})
        }
    
    if join_code:
        response = households_table.scan(
            FilterExpression="JoinCode = :code",
            ExpressionAttributeValues={":code": join_code}
        )
        items = response.get("Items", [])
        if not items:
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"message": "Invalid Join Code"})
            }
        household = items[0]
        household_id = household["HouseholdID"]
        
        updated_members = household.get("Members", [])
        if user_id not in updated_members:
            updated_members.append(user_id)
            households_table.update_item(
                Key={"HouseholdID": household_id},
                UpdateExpression="SET Members = :members",
                ExpressionAttributeValues={":members": updated_members}
            )
            users_table.update_item(
                Key={"UserID": user_id},
                UpdateExpression="SET HouseholdID = :hid",
                ExpressionAttributeValues={":hid": household_id}
            )
            message = "User added to household"
        else:
            message = "User is already part of the household"
    else:
        if not household_id:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"message": "HouseholdID is required if no JoinCode is provided"})
            }
        response = households_table.get_item(Key={"HouseholdID": household_id})
        household = response.get("Item")
        if not household:
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"message": "Household not found"})
            }
        message = "Household retrieved"
    
    household_name = household.get("Name", "Unknown")
    if isinstance(household_name, dict) and "S" in household_name:
        household_name = household_name["S"]
    
    join_code_val = household.get("JoinCode", "")
    
    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({
            "message": message,
            "HouseholdID": household.get("HouseholdID"),
            "HouseholdName": household_name,
            "JoinCode": join_code_val,
            "Admins": household.get("Admins", []) 
        })
    }
