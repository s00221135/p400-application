import json
import boto3
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("SocialFeedPosts")

# ✅ Helper function to convert Decimal values to float
def convert_decimal(obj):
    if isinstance(obj, Decimal):
        return float(obj)  # Convert Decimal to float
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    if isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    return obj

def lambda_handler(event, context):
    try:
        # Extract PostID from path parameters
        post_id = event["pathParameters"]["postID"]

        # Fetch the post from DynamoDB
        response = table.get_item(Key={"PostID": post_id})

        # Check if post exists
        if "Item" not in response:
            return {
                "statusCode": 404,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                "body": json.dumps({"message": "Post not found"})
            }

        # ✅ Convert Decimal values to JSON serializable format
        post_data = convert_decimal(response["Item"])

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps(post_data)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"message": "Error fetching post", "error": str(e)})
        }
