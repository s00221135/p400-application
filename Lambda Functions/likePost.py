import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("SocialFeedPosts")

def decimal_to_int(obj):
    if isinstance(obj, Decimal):
        return int(obj)
    raise TypeError

def lambda_handler(event, context):
    try:

        if "body" in event and event["body"]:
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

        post_id = body.get("PostID")
        if not post_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                "body": json.dumps({"message": "PostID is required"})
            }

        post_data = table.get_item(Key={"PostID": post_id})
        current_likes = post_data.get("Item", {}).get("Likes", 0)

        if isinstance(current_likes, Decimal):
            current_likes = int(current_likes)

        response = table.update_item(
            Key={"PostID": post_id},
            UpdateExpression="SET Likes = :new_likes",
            ExpressionAttributeValues={":new_likes": current_likes + 1},
            ReturnValues="UPDATED_NEW"
        )

        updated_likes = int(response["Attributes"]["Likes"])

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({
                "message": "Post liked successfully",
                "UpdatedLikes": updated_likes
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"message": "Error liking post", "error": str(e)})
        }
