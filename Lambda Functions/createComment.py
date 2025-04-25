import json
import boto3
import uuid
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("SocialFeedComments")

def lambda_handler(event, context):
    try:
        # Parse request body
        if "body" in event:
            body = json.loads(event["body"])
        else:
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                "body": json.dumps({"message": "Missing request body"})
            }

        # Extract required fields
        post_id = body.get("PostID")
        user_id = body.get("UserID")
        content = body.get("Content")

        if not post_id or not user_id or not content:
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                "body": json.dumps({"message": "Missing required fields"})
            }

        # Generate unique CommentID
        comment_id = str(uuid.uuid4())

        # Store comment in DynamoDB
        item = {
            "CommentID": comment_id,
            "PostID": post_id,
            "UserID": user_id,
            "Content": content,
            "CreatedAt": datetime.utcnow().isoformat()
        }

        table.put_item(Item=item)

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"message": "Comment added successfully", "CommentID": comment_id})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"message": "Error adding comment", "error": str(e)})
        }
