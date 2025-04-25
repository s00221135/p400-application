import json
import boto3
import math
from decimal import Decimal

# Initialize AWS services
dynamodb = boto3.resource("dynamodb")
posts_table = dynamodb.Table("SocialFeedPosts")
users_table = boto3.client("dynamodb")  # using client for get_item

# Amazon Location Service Geofence Collection Name
GEOFENCE_COLLECTION = "student-post-geofences"

def build_response(status_code, message, extra_data=None):
    body = {"message": message}
    if extra_data:
        body.update(extra_data)
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body, default=str)
    }

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points on Earth.
    Inputs are in decimal degrees. Returns the distance in meters.
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371000  # Earth radius in meters
    return c * r

def lambda_handler(event, context):
    print("Received event:", json.dumps(event, indent=2))
    try:
        # Extract user's location from query parameters.
        query_params = event.get("queryStringParameters", {}) or {}
        user_lat = query_params.get("Latitude")
        user_long = query_params.get("Longitude")

        # If no location provided, return empty posts.
        if not user_lat or not user_long:
            print("No user location provided; returning empty posts.")
            return build_response(200, "Posts fetched successfully", {"posts": []})

        try:
            user_lat = float(user_lat)
            user_long = float(user_long)
            print(f"User location: {user_lat}, {user_long}")
        except Exception as e:
            print("Error converting user location:", e)
            return build_response(200, "Posts fetched successfully", {"posts": []})

        # Get all posts from DynamoDB.
        dynamodb_response = posts_table.scan()
        posts = dynamodb_response.get("Items", [])

        filtered_posts = []
        for post in posts:
            try:
                post_lat = float(post.get("Latitude"))
                post_long = float(post.get("Longitude"))
            except Exception as e:
                print(f"Skipping post {post.get('PostID')} due to conversion error: {e}")
                continue

            # Retrieve user display name if not already set.
            user_id = post.get("UserID")
            if user_id and not post.get("Author"):
                user_response = users_table.get_item(
                    TableName="UserDetails",
                    Key={"UserID": {"S": user_id}}
                )
                if "Item" in user_response:
                    post["Author"] = user_response["Item"].get("Name", {}).get("S", "Unknown User")
                else:
                    post["Author"] = "Unknown User"

            # Get the allowed geofence radius (in meters) from the post.
            try:
                allowed_radius = float(post.get("GeofenceRadius", 0))
            except Exception as e:
                print(f"Error converting GeofenceRadius for post {post.get('PostID')}: {e}")
                allowed_radius = 0

            # Calculate the distance between user's location and the post.
            distance = haversine_distance(user_lat, user_long, post_lat, post_long)
            print(f"Post {post.get('PostID')}: distance = {distance:.2f} m, allowed radius = {allowed_radius} m")
            if distance <= allowed_radius:
                filtered_posts.append(post)

        # Sort posts by CreatedAt descending (most recent first).
        filtered_posts.sort(key=lambda p: p.get("CreatedAt", ""), reverse=True)

        return build_response(200, "Posts fetched successfully", {"posts": filtered_posts})
    
    except Exception as e:
        print(f"Error: {e}")
        return build_response(500, "Error fetching posts", {"error": str(e)})
