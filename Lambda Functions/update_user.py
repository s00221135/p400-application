from decimal import Decimal, InvalidOperation
import json
import boto3

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserDetails')  # Ensure this matches your DynamoDB table name

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
    # Handle preflight OPTIONS request for CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "http://localhost:5173",  # Adjust as needed
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,PUT,GET,DELETE"
            },
            "body": ""
        }
    
    # Parse the request body
    try:
        body = json.loads(event.get("body", "{}"))
        user_id = body["UserID"]
    except (KeyError, json.JSONDecodeError) as e:
        print("Error parsing body or missing UserID:", e)
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "http://localhost:5173",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,PUT,GET,DELETE"
            },
            "body": json.dumps({"message": "UserID is required in request body"})
        }
    
    # Build an update expression dynamically for all fields except "UserID"
    expression_pieces = []
    expression_names = {}
    expression_values = {}

    for key, value in body.items():
        if key == "UserID":
            continue

        expression_pieces.append(f"#field_{key} = :val_{key}")
        expression_names[f"#field_{key}"] = key

        # Explicitly check for booleans first so they don't get converted to Decimal.
        if isinstance(value, bool):
            expression_values[f":val_{key}"] = value
        # Process numeric types directly.
        elif isinstance(value, (int, float)):
            try:
                expression_values[f":val_{key}"] = Decimal(str(value))
            except (ValueError, InvalidOperation) as num_err:
                print(f"Error converting numeric field {key}: {num_err}")
                expression_values[f":val_{key}"] = value
        # For strings, attempt to convert only if it seems numeric.
        elif isinstance(value, str):
            if value.strip() == "":
                expression_values[f":val_{key}"] = value
            else:
                try:
                    # Attempt to convert to float; if successful, then to Decimal.
                    float_value = float(value)
                    expression_values[f":val_{key}"] = Decimal(value)
                except (ValueError, InvalidOperation):
                    # Otherwise, use the string as-is.
                    expression_values[f":val_{key}"] = value
        else:
            # For other types, store as is.
            expression_values[f":val_{key}"] = value

    if not expression_pieces:
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "http://localhost:5173",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,PUT,GET,DELETE"
            },
            "body": json.dumps({"message": "No fields provided to update"})
        }

    update_expression = "SET " + ", ".join(expression_pieces)
    print("UpdateExpression:", update_expression)
    print("ExpressionAttributeNames:", expression_names)
    print("ExpressionAttributeValues:", expression_values)
    
    try:
        result = table.update_item(
            Key={"UserID": user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values,
            ReturnValues="ALL_NEW"
        )
        updated_item = convert_decimals(result.get("Attributes", {}))
        print("Update result:", updated_item)
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,PUT,GET,DELETE"
            },
            "body": json.dumps({
                "message": "User updated successfully",
                "UpdatedItem": updated_item
            })
        }
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,PUT,GET,DELETE"
            },
            "body": json.dumps({"message": "Internal Server Error", "error": str(e)})
        }
