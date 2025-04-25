import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
geo_client = boto3.client("location") 

posts_table = dynamodb.Table("SocialFeedPosts")
users_table = dynamodb.Table("UserDetails")

GEOFENCE_COLLECTION = "student-post-geofences"

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
    print("Received event:", json.dumps(event, indent=2)) 

    try:
        body = event.get("body")
        if not body:
            return response(400, "Missing request body")

        body = json.loads(body)

        user_id = body.get("UserID")
        content = body.get("Content")
        latitude = body.get("Latitude")
        longitude = body.get("Longitude")
        tags = body.get("Tags", []) 
        geofence_radius = body.get("GeofenceRadius", 500) 

        if not user_id or not content or latitude is None or longitude is None:
            return response(400, "Missing required fields")

        latitude = Decimal(str(latitude))
        longitude = Decimal(str(longitude))
        geofence_radius = Decimal(str(geofence_radius))

        user_data = users_table.get_item(Key={"UserID": user_id})
        if "Item" not in user_data:
            return response(404, "User not found")

        display_name = user_data["Item"].get("Name", "Unknown User")

        post_id = str(uuid.uuid4())

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

        item = {
            "PostID": post_id,
            "UserID": user_id,
            "UserName": display_name,
            "Content": content,
            "Tags": tags,
            "GeofenceRadius": geofence_radius,
            "Latitude": latitude,
            "Longitude": longitude,
            "GeofenceID": geofence_id,
            "CreatedAt": datetime.utcnow().isoformat(),
            "Likes": 0
        }
        posts_table.put_item(Item=item)

        return response(200, "Post created successfully", {"PostID": post_id})

    except Exception as e:
        print(f"Error: {e}") 
        return response(500, "Error creating post", {"error": str(e)})
