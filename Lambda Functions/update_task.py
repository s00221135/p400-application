import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Households')  # Make sure this matches your actual table name

def lambda_handler(event, context):
    try:
        # Extract path param (taskID) from the URL
        task_id = event["pathParameters"]["taskID"]

        # Parse JSON body sent from client
        body = json.loads(event["body"])
        
        household_id = body.get("HouseholdID")
        title = body.get("Title")
        assigned_to = body.get("AssignedTo")
        frequency = body.get("Frequency")
        due_date = body.get("DueDate")
        completed = body.get("Completed")

        # Validate input
        if not household_id:
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps("HouseholdID is required")
            }

        # 1) Retrieve the existing household item
        response = table.get_item(Key={"HouseholdID": household_id})
        household = response.get("Item")

        if not household or "Tasks" not in household:
            return {
                "statusCode": 404,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps("No tasks found for that Household")
            }

        # 2) Update the matching task in memory
        tasks = household["Tasks"]  # This is a list of dicts
        task_found = False
        
        for t in tasks:
            if t["TaskID"] == task_id:
                t["Title"] = title
                t["AssignedTo"] = assigned_to
                t["Frequency"] = frequency
                t["DueDate"] = due_date
                t["Completed"] = completed
                task_found = True
                break
        
        if not task_found:
            return {
                "statusCode": 404,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps("Task not found")
            }

        # 3) Update the table with the *entire* tasks array
        table.update_item(
            Key={"HouseholdID": household_id},
            UpdateExpression="SET Tasks = :tasks",
            ExpressionAttributeValues={":tasks": tasks}
        )

        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"message": "Task updated", "tasks": tasks})
        }

    except Exception as e:
        print("Error:", e)
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps(f"Error: {str(e)}")
        }
