from decimal import Decimal
import json
import boto3
from datetime import datetime

# Initialize DynamoDB resource and table
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserDetails')  # Ensure this matches your DynamoDB table name

def lambda_handler(event, context):
    # Log the incoming event for debugging
    print("Received event:", json.dumps(event))
    
    try:
        # If the event is wrapped by Lambda Proxy Integration, the payload is in event["body"]
        if "body" in event:
            payload = json.loads(event["body"])
        else:
            payload = event

        # Check if the payload is in Cognito trigger format (wrapped in "request")
        if "request" in payload and "userAttributes" in payload["request"]:
            user_attributes = payload["request"]["userAttributes"]
        else:
            user_attributes = payload

        # Extract user attributes (support both Cognito-style and plain JSON)
        user_id = user_attributes.get('sub') or user_attributes.get("UserID")
        name = user_attributes.get('name') or user_attributes.get("Name", "Unknown")
        email = user_attributes.get('email') or user_attributes.get("Email", "Unknown")
        area_of_study = user_attributes.get('custom:AreaOfStudy', "Unknown")
        college = user_attributes.get('custom:College', "Unknown")
        latitude = float(user_attributes.get('custom:Latitude', 0.0))
        longitude = float(user_attributes.get('custom:Longitude', 0.0))

        # Prepare the item to insert into DynamoDB
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

        # Insert the item into DynamoDB
        table.put_item(Item=item)
        print(f"User {user_id} saved to DynamoDB.")

    except Exception as e:
        print(f"Error saving user to DynamoDB: {str(e)}")
        # For API calls, return an HTTP error with CORS headers;
        # For Cognito triggers, throwing the error will cause Cognito to fail the trigger.
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
    
    # If this is a Cognito trigger event (it contains "triggerSource"), return the event unmodified.
    if "triggerSource" in payload:
        return event
    else:
        # Otherwise, return a proper HTTP response with CORS headers.
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            "body": json.dumps({"message": "User added", "user": item}, default=lambda o: float(o) if isinstance(o, Decimal) else o)
        }
