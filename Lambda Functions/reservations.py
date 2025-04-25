import json
import uuid
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
TABLE_NAME = "ReservedSpaces"
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    method = event.get("httpMethod", "")
    path_parameters = event.get("pathParameters") or {}
    query_params = event.get("queryStringParameters") or {}
    reservation_id = path_parameters.get("id")

    # Resource path might look like /reservations/{id}/approve for approvals
    resource_path = event.get("resource", "")

    # Get HouseholdID from query string or request body
    household_id = query_params.get("HouseholdID")
    if not household_id:
        try:
            body = json.loads(event.get("body") or "{}")
            household_id = body.get("HouseholdID")
        except Exception as e:
            print("Error parsing body for HouseholdID:", e)

    if not household_id:
        return respond(400, {"message": "Missing HouseholdID"})

    try:
        if method == "GET":
            # List reservations for the household
            response = table.query(
                KeyConditionExpression=Key('HouseholdID').eq(household_id)
            )
            reservations = response.get('Items', [])
            return respond(200, {"reservations": reservations})

        elif method == "POST":
            # Create a new reservation
            data = json.loads(event.get('body') or "{}")

            data['ReservationID'] = str(uuid.uuid4())
            data['HouseholdID'] = household_id

            # Always start as Pending
            data['ApprovalStatus'] = "Pending"
            data['Approvers'] = []

            table.put_item(Item=data)
            return respond(201, data)

        elif method == "PUT":
            # Update an existing reservation (full replace)
            if not reservation_id:
                return respond(400, {"message": "Missing reservation ID in path"})

            data = json.loads(event.get('body') or "{}")

            # This is how we identify the user making the request.
            # In a real app, you'd parse a JWT or session token.
            requesting_user_id = data.get("RequestUserID")
            if not requesting_user_id:
                return respond(400, {"message": "Missing RequestUserID in request body"})

            # Fetch the existing item to confirm ownership
            existing_item = table.get_item(
                Key={"HouseholdID": household_id, "ReservationID": reservation_id}
            ).get("Item")

            if not existing_item:
                return respond(404, {"message": "Reservation not found"})

            # If the user is not the creator, forbid
            if existing_item["ReservedBy"] != requesting_user_id:
                return respond(403, {"message": "You are not allowed to edit this reservation."})

            # Preserve the same ReservationID & HouseholdID
            data['ReservationID'] = reservation_id
            data['HouseholdID'] = household_id

            # If client didn't provide ApprovalStatus or Approvers, preserve existing
            if 'ApprovalStatus' not in data:
                data['ApprovalStatus'] = existing_item.get('ApprovalStatus', 'Pending')
            if 'Approvers' not in data:
                data['Approvers'] = existing_item.get('Approvers', [])

            table.put_item(Item=data)
            return respond(200, data)

        elif method == "DELETE":
            # Delete a reservation
            if not reservation_id:
                return respond(400, {"message": "Missing reservation ID in path"})

            # GET the user from query param for demonstration
            requesting_user_id = query_params.get("UserID")
            if not requesting_user_id:
                return respond(400, {"message": "Missing UserID in query parameters"})

            existing_item = table.get_item(
                Key={"HouseholdID": household_id, "ReservationID": reservation_id}
            ).get("Item")

            if not existing_item:
                return respond(404, {"message": "Reservation not found"})

            # Only allow the original creator to delete
            if existing_item["ReservedBy"] != requesting_user_id:
                return respond(403, {"message": "You are not allowed to delete this reservation."})

            table.delete_item(
                Key={
                    "HouseholdID": household_id,
                    "ReservationID": reservation_id
                }
            )
            return respond(200, {"message": "Reservation deleted"})

        elif method == "PATCH" and resource_path == "/reservations/{id}/approve":
            # Approve or reject a reservation
            if not reservation_id:
                return respond(400, {"message": "Missing reservation ID in path"})
            body_data = json.loads(event.get("body") or "{}")
            action = body_data.get("Action")  # "Approve" or "Reject"
            user_id = body_data.get("UserID")

            if not action or not user_id:
                return respond(400, {"message": "Missing Action or UserID in request body"})

            existing_item = table.get_item(
                Key={
                    "HouseholdID": household_id,
                    "ReservationID": reservation_id
                }
            ).get("Item")

            if not existing_item:
                return respond(404, {"message": "Reservation not found"})

            # If user hasn't already approved, add them to Approvers
            approvers = existing_item.get("Approvers", [])
            if user_id not in approvers:
                approvers.append(user_id)
            existing_item["Approvers"] = approvers

            # Approve/Reject
            if action == "Approve":
                existing_item["ApprovalStatus"] = "Approved"
            elif action == "Reject":
                existing_item["ApprovalStatus"] = "Rejected"
            else:
                return respond(400, {"message": "Invalid Action"})

            table.put_item(Item=existing_item)
            return respond(200, existing_item)

        else:
            return respond(405, {"message": f"Method not allowed: {method}"})

    except Exception as e:
        print("Error:", e)
        return respond(500, {"message": str(e)})

def respond(status_code, body):
    """Return a JSON response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(body)
    }
