import os
import json
import uuid
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
TABLE_NAME = os.environ.get('SHOPPING_LISTS_TABLE', 'ShoppingLists')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Credentials": "true"
            },
            "body": ""
        }
    
    try:
        if "body" in event:
            payload = json.loads(event.get("body") or "{}")
        else:
            payload = event
        
        method = event.get("httpMethod", "")
        path_params = event.get("pathParameters") or {}
        query_params = event.get("queryStringParameters") or {}
        list_id = path_params.get("id")
        
        household_id = query_params.get("HouseholdID") or payload.get("HouseholdID")
        if not household_id:
            return respond(400, {"message": "Missing HouseholdID"})
        
        if method == "GET":
            if list_id:
                result = table.get_item(Key={"HouseholdID": household_id, "ListID": list_id})
                if "Item" in result:
                    return respond(200, result["Item"])
                else:
                    return respond(404, {"message": "Shopping list not found"})
            else:
                result = table.query(KeyConditionExpression=Key("HouseholdID").eq(household_id))
                return respond(200, {"shoppingLists": result.get("Items", [])})
        
        elif method == "POST":
            list_id = str(uuid.uuid4())
            payload["ListID"] = list_id
            payload["HouseholdID"] = household_id
            payload["Products"] = payload.get("Products", [])
            table.put_item(Item=payload)
            return respond(201, payload)
        
        elif method == "PUT":
            if not list_id:
                return respond(400, {"message": "Missing List ID in path"})
            payload["ListID"] = list_id
            payload["HouseholdID"] = household_id
            table.put_item(Item=payload)
            return respond(200, payload)
        
        elif method == "DELETE":
            if not list_id:
                return respond(400, {"message": "Missing List ID in path"})
            table.delete_item(Key={"HouseholdID": household_id, "ListID": list_id})
            return respond(200, {"message": "Shopping list deleted"})
        
        else:
            return respond(405, {"message": "Method not allowed"})
    
    except Exception as e:
        print("Error:", e)
        return respond(500, {"message": str(e)})

def respond(status_code, body):
    def decimal_default(obj):
        if isinstance(obj, Decimal):
            return float(obj)
        raise TypeError
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(body, default=decimal_default)
    }
