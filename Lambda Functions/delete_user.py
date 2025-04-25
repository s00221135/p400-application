import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserDetails')


def convert_decimals(obj):
    """
    Recursively convert any Decimal to float in a dict or list.
    """
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj) 
    else:
        return obj


def lambda_handler(event, context):
    """
    Expects JSON in event with:
    {
      "UserID": "12345-abcde"
    }
    """
    user_id = event["UserID"]
    
    response = table.delete_item(
        Key={
            "UserID": user_id
        },
        ReturnValues="ALL_OLD" 
    )

    if "Attributes" not in response:
        return {
            "statusCode": 404,
            "body": json.dumps({"message": "User not found or already deleted"})
        }

    deleted_item = convert_decimals(response["Attributes"])

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "User deleted successfully",
            "DeletedItem": deleted_item
        })
    }
