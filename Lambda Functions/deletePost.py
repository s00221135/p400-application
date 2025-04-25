import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
posts_table = dynamodb.Table("SocialFeedPosts")
geo_client = boto3.client("location")
GEOFENCE_COLLECTION = "student-post-geofences"

def build_response(status_code, message, extra_data=None):
    body = {"message": message}
    if extra_data:
        body.update(extra_data)
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body, default=str)
    }

def lambda_handler(event, context):
    print("Received event:", json.dumps(event, indent=2))
    try:
        body = event.get("body")
        if not body:
            return build_response(400, "Missing request body")
        data = json.loads(body)
        post_id = data.get("PostID")
        requester_user_id = data.get("UserID")
        if not post_id or not requester_user_id:
            return build_response(400, "Missing required parameters: PostID and UserID")
        
        response_get = posts_table.get_item(Key={"PostID": post_id})
        post = response_get.get("Item")
        if not post:
            return build_response(404, "Post not found")
        
        if post.get("UserID") != requester_user_id:
            return build_response(403, "Unauthorized to delete this post")
        
        geofence_id = post.get("GeofenceID")
        if geofence_id:
            try:
                geo_client.delete_geofence(
                    CollectionName=GEOFENCE_COLLECTION,
                    GeofenceId=geofence_id
                )
                print(f"Deleted geofence {geofence_id}")
            except Exception as geo_err:
                print(f"Warning: Unable to delete geofence {geofence_id}: {geo_err}")
        
        posts_table.delete_item(
            Key={"PostID": post_id},
            ConditionExpression="UserID = :uid",
            ExpressionAttributeValues={":uid": requester_user_id}
        )
        
        return build_response(200, "Post deleted successfully")
    
    except Exception as e:
        print("Error:", str(e))
        return build_response(500, "Error deleting post", {"error": str(e)})
