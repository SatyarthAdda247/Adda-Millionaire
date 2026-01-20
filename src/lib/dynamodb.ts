/**
 * Frontend DynamoDB Client
 * 
 * ⚠️ SECURITY WARNING:
 * This allows direct DynamoDB access from the frontend.
 * AWS credentials are stored in Vercel environment variables (VITE_AWS_*)
 * Never commit credentials to git!
 * 
 * For production, consider using:
 * - AWS Amplify (recommended)
 * - Vercel Serverless Functions
 * - API Gateway + Lambda
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// AWS Configuration from environment variables
// These should be set in Vercel environment variables:
// - VITE_AWS_REGION
// - VITE_AWS_ACCESS_KEY_ID
// - VITE_AWS_SECRET_ACCESS_KEY
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'ap-south-1';
const AWS_ACCESS_KEY_ID = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

// Table names
const USERS_TABLE = import.meta.env.VITE_DYNAMODB_USERS_TABLE || 'edurise-users';
const LINKS_TABLE = import.meta.env.VITE_DYNAMODB_LINKS_TABLE || 'edurise-links';
const ANALYTICS_TABLE = import.meta.env.VITE_DYNAMODB_ANALYTICS_TABLE || 'edurise-analytics';

// Initialize DynamoDB Client
let client: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;

function getClient() {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      'AWS credentials not configured. Please set VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY in Vercel environment variables.'
    );
  }

  if (!client) {
    client = new DynamoDBClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    docClient = DynamoDBDocumentClient.from(client);
  }

  return docClient!;
}

// Save user to DynamoDB
export async function saveUser(user: any) {
  try {
    const client = getClient();
    await client.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        id: user.id,
        ...user,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }));
    return { success: true, user };
  } catch (error: any) {
    console.error('Error saving user to DynamoDB:', error);
    throw new Error(`Failed to save user: ${error.message}`);
  }
}

// Get user by email
export async function getUserByEmail(email: string) {
  try {
    const client = getClient();
    const result = await client.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase().trim()
      }
    }));
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error: any) {
    console.error('Error getting user by email:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

// Get user by phone
export async function getUserByPhone(phone: string) {
  try {
    const client = getClient();
    const phoneDigits = phone.replace(/\D/g, '');
    const result = await client.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'contains(phone, :phone)',
      ExpressionAttributeValues: {
        ':phone': phoneDigits
      }
    }));
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error: any) {
    console.error('Error getting user by phone:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  try {
    const client = getClient();
    const result = await client.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }));
    return result.Item || null;
  } catch (error: any) {
    console.error('Error getting user by ID:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

// Check if DynamoDB is configured
export function isDynamoDBConfigured(): boolean {
  const configured = !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);
  
  // Log configuration status in development
  if (typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'))) {
    if (configured) {
      console.log('✅ DynamoDB configured:', {
        region: AWS_REGION,
        accessKeyId: AWS_ACCESS_KEY_ID ? `${AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'not set',
        secretAccessKey: AWS_SECRET_ACCESS_KEY ? 'set' : 'not set'
      });
    } else {
      console.warn('⚠️ DynamoDB not configured. Set VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY in environment variables.');
    }
  }
  
  return configured;
}

// Export table names
export { USERS_TABLE, LINKS_TABLE, ANALYTICS_TABLE };
