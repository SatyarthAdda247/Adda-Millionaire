import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

const client = new DynamoDBClient({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'edurise-users';
const LINKS_TABLE = process.env.DYNAMODB_LINKS_TABLE || 'edurise-links';
const ANALYTICS_TABLE = process.env.DYNAMODB_ANALYTICS_TABLE || 'edurise-analytics';

async function createTable(tableName, keySchema, attributeDefinitions) {
  try {
    console.log(`Creating table: ${tableName}...`);
    await client.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
    }));
    console.log(`✅ Table ${tableName} created successfully`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`⚠️  Table ${tableName} already exists`);
    } else {
      console.error(`❌ Error creating table ${tableName}:`, error.message);
      throw error;
    }
  }
}

async function setupTables() {
  console.log('🚀 Setting up DynamoDB tables...\n');

  // Create Users table
  await createTable(
    USERS_TABLE,
    [{ AttributeName: 'id', KeyType: 'HASH' }],
    [{ AttributeName: 'id', AttributeType: 'S' }]
  );

  // Create Links table
  await createTable(
    LINKS_TABLE,
    [{ AttributeName: 'id', KeyType: 'HASH' }],
    [{ AttributeName: 'id', AttributeType: 'S' }]
  );

  // Create Analytics table
  await createTable(
    ANALYTICS_TABLE,
    [{ AttributeName: 'id', KeyType: 'HASH' }],
    [{ AttributeName: 'id', AttributeType: 'S' }]
  );

  console.log('\n✅ All tables setup complete!');
  console.log('\n📋 Table names:');
  console.log(`   - ${USERS_TABLE}`);
  console.log(`   - ${LINKS_TABLE}`);
  console.log(`   - ${ANALYTICS_TABLE}`);
}

setupTables().catch(console.error);
