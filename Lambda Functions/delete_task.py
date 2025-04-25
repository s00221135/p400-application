import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Households')

def lambda_handler(event, context):
    try:
        task_id = event["pathParameters"]["taskID"]
        
        household_id = event["queryStringParameters"]["HouseholdID"]

        response = table.get_item(Key={"HouseholdID": household_id})
        household = response.get('Item')

        if not household or "Tasks" not in household:
            return {
                "statusCode": 404,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps("Household or tasks not found")
            }

        updated_tasks = [task for task in household["Tasks"] if task["TaskID"] != task_id]

        table.update_item(
            Key={"HouseholdID": household_id},
            UpdateExpression="SET Tasks = :tasks",
            ExpressionAttributeValues={":tasks": updated_tasks}
        )

        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"message": "Task deleted", "tasks": updated_tasks})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps(f"Error: {str(e)}")
        }
