import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Households')

def lambda_handler(event, context):
    try:
        print("📡 Event received:", json.dumps(event))  # Debugging event
        
        # ✅ Extract HouseholdID correctly
        household_id = event.get('queryStringParameters', {}).get('HouseholdID')

        if not household_id:
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps("Missing HouseholdID")
            }

        print("🔍 Fetching tasks for HouseholdID:", household_id)  # Debugging

        response = table.get_item(Key={"HouseholdID": household_id})
        household = response.get('Item')

        if not household or "Tasks" not in household:
            return {
                "statusCode": 404,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"message": "No tasks found"})
            }

        print("✅ Tasks retrieved successfully:", household["Tasks"])  # Debugging

        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"tasks": household["Tasks"]})
        }

    except Exception as e:
        print("🚨 Error:", str(e))  # Debugging errors
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps(f"Error: {str(e)}")
        }
