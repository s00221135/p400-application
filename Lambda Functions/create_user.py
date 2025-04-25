from decimal import Decimal
import json
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserDetails') 

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    
    try:
        if "body" in event:
            payload = json.loads(event["body"])
        else:
            payload = event

        if "request" in payload and "userAttributes" in payload["request"]:
            user_attributes = payload["request"]["userAttributes"]
        else:
            user_attributes = payload

        user_id = user_attributes.get('sub') or user_attributes.get("UserID")
        name = user_attributes.get('name') or user_attributes.get("Name", "Unknown")
        email = user_attributes.get('email') or user_attributes.get("Email", "Unknown")
        area_of_study = user_attributes.get('custom:AreaOfStudy', "Unknown")
        college = user_attributes.get('custom:College', "Unknown")
        latitude = float(user_attributes.get('custom:Latitude', 0.0))
        longitude = float(user_attributes.get('custom:Longitude', 0.0))

        item = {
            "UserID": user_id,
            "Name": name,
            "Email": email,
            "AreaOfStudy": area_of_study,
            "College": college,
            "CreatedAt": datetime.utcnow().isoformat(),
            "DoNotDisturb": False,
            "HouseholdID": None,
            "Latitude": Decimal(str(latitude)),
            "Longitude": Decimal(str(longitude))
        }

        table.put_item(Item=item)
        print(f"User {user_id} saved to DynamoDB.")

    except Exception as e:
        print(f"Error saving user to DynamoDB: {str(e)}")
        if "triggerSource" in payload:
            raise e
        else:
            return {
                "statusCode": 500,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                "body": json.dumps({"error": str(e)})
            }
    
    if "triggerSource" in payload:
        return event
    else:
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            "body": json.dumps({"message": "User added", "user": item}, default=lambda o: float(o) if isinstance(o, Decimal) else o)
        }
