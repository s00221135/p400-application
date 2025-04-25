import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS services
dynamodb = boto3.resource("dynamodb")
geo_client = boto3.client("location")  # Amazon Location Service Client

# DynamoDB Tables
posts_table = dynamodb.Table("SocialFeedPosts")
users_table = dynamodb.Table("UserDetails")

# Amazon Location Service Geofence Collection Name
GEOFENCE_COLLECTION = "student-post-geofences"

# ✅ Move response function to the top to prevent "UnboundLocalError"
def response(status_code, message, extra_data=None):
    body = {"message": message}
    if extra_data:
        body.update(extra_data)
    
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body)
    }

def lambda_handler(event, context):
    print("Received event:", json.dumps(event, indent=2))  # Debug log

    try:
        # Ensure event body exists and is properly parsed
        body = event.get("body")
        if not body:
            return response(400, "Missing request body")

        body = json.loads(body)

        # Extract post data
        user_id = body.get("UserID")
        content = body.get("Content")
        latitude = body.get("Latitude")
        longitude = body.get("Longitude")
        tags = body.get("Tags", [])  # Default to empty list
        geofence_radius = body.get("GeofenceRadius", 500)  # Default 500m

        if not user_id or not content or latitude is None or longitude is None:
            return response(400, "Missing required fields")

        # Convert to Decimal for DynamoDB
        latitude = Decimal(str(latitude))
        longitude = Decimal(str(longitude))
        geofence_radius = Decimal(str(geofence_radius))

        # Fetch user details
        user_data = users_table.get_item(Key={"UserID": user_id})
        if "Item" not in user_data:
            return response(404, "User not found")

        display_name = user_data["Item"].get("Name", "Unknown User")

        # Generate Post ID
        post_id = str(uuid.uuid4())

        # ✅ **Log ALS interaction before creating a geofence**
        print(f"Creating geofence for PostID: {post_id}, Lat: {latitude}, Long: {longitude}")

        #Create a geofence in Amazon Location Service
        geofence_id = f"post-{post_id}"
        response_geo = geo_client.put_geofence(
            CollectionName=GEOFENCE_COLLECTION,
            GeofenceId=geofence_id,
            Geometry={
                "Polygon": [[
                    [float(longitude) - 0.001, float(latitude) - 0.001],
                    [float(longitude) + 0.001, float(latitude) - 0.001],
                    [float(longitude) + 0.001, float(latitude) + 0.001],
                    [float(longitude) - 0.001, float(latitude) + 0.001],
                    [float(longitude) - 0.001, float(latitude) - 0.001]
                ]]
            }
        )

        #Logs response from Location Service
        print(f"Geofence created: {response_geo}")

        #Store Post in DB
        item = {
            "PostID": post_id,
            "UserID": user_id,
            "UserName": display_name,
            "Content": content,
            "Tags": tags,
            "GeofenceRadius": geofence_radius,
            "Latitude": latitude,
            "Longitude": longitude,
            "GeofenceID": geofence_id,  # ✅ Store GeofenceID
            "CreatedAt": datetime.utcnow().isoformat(),
            "Likes": 0
        }
        posts_table.put_item(Item=item)

        return response(200, "Post created successfully", {"PostID": post_id})

    except Exception as e:
        print(f"Error: {e}")  # ✅ Log the error for debugging
        return response(500, "Error creating post", {"error": str(e)})
