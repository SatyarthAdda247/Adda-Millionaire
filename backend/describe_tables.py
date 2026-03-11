import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def describe_tables():
    try:
        dynamodb = boto3.client(
            'dynamodb',
            region_name=os.getenv('AWS_REGION', 'ap-south-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        tables = ['edurise-analytics', 'edurise-users', 'edurise-links']
        
        for table_name in tables:
            print(f"\n--- Table: {table_name} ---")
            try:
                response = dynamodb.describe_table(TableName=table_name)
                schema = response['Table']['KeySchema']
                attrs = response['Table']['AttributeDefinitions']
                print("Key Schema:", schema)
                print("Attribute Definitions:", attrs)
            except Exception as e:
                print(f"Error describing {table_name}: {e}")
                
    except Exception as e:
        print(f"Global Error: {e}")

if __name__ == "__main__":
    describe_tables()
