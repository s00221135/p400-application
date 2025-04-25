import json
import boto3
import uuid

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Households')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        household_id = body.get('HouseholdID')
        title = body.get('Title')
        assigned_to = body.get('AssignedTo')
        frequency = body.get('Frequency')
        due_date = body.get('DueDate')

        if not household_id or not title:
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps("Missing required fields")
            }

        new_task = {
            "TaskID": str(uuid.uuid4()),
            "Title": title,
            "AssignedTo": assigned_to,
            "Frequency": frequency,
            "DueDate": due_date,
            "Completed": False
        }

        # ✅ Add task to Household's task list
        table.update_item(
            Key={"HouseholdID": household_id},
            UpdateExpression="SET Tasks = list_append(if_not_exists(Tasks, :empty_list), :task)",
            ExpressionAttributeValues={
                ":task": [new_task],
                ":empty_list": []
            }
        )

        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"message": "Task added", "task": new_task})
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps(f"Error: {str(e)}")
        }
