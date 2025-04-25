import json
import boto3

# Initialize DynamoDB
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("SocialFeedComments")  # Ensure this matches your table name

def lambda_handler(event, context):
    try:
        # Extract PostID from path parameters
        post_id = event.get("pathParameters", {}).get("postID")

        if not post_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({"message": "Missing postID in request"})
            }

        # ⚡ Use Scan to find comments with matching PostID (Not optimal but necessary)
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("PostID").eq(post_id)
        )

        comments = response.get("Items", [])

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"comments": comments})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"message": "Error fetching comments", "error": str(e)})
        }
