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
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

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
    
    // Provide helpful error messages for common AWS errors
    if (error.name === 'AccessDeniedException' || error.name === 'UnauthorizedOperation') {
      throw new Error('AWS Access Denied: Check that your AWS credentials have DynamoDB permissions (PutItem, GetItem, Scan, Query)');
    } else if (error.name === 'ResourceNotFoundException') {
      throw new Error(`DynamoDB table "${USERS_TABLE}" not found. Run: node server/setup-dynamodb.js to create tables.`);
    } else if (error.name === 'ValidationException') {
      throw new Error(`Invalid DynamoDB request: ${error.message}`);
    } else if (error.$metadata?.httpStatusCode === 403) {
      throw new Error('AWS returned 403 Forbidden. Check IAM permissions for DynamoDB access.');
    }
    
    throw new Error(`Failed to save user: ${error.message || error.name || 'Unknown error'}`);
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
    
    if (error.name === 'AccessDeniedException' || error.$metadata?.httpStatusCode === 403) {
      throw new Error('AWS Access Denied: Check DynamoDB permissions (Scan, GetItem)');
    } else if (error.name === 'ResourceNotFoundException') {
      throw new Error(`DynamoDB table "${USERS_TABLE}" not found. Create tables first.`);
    }
    
    throw new Error(`Failed to get user: ${error.message || error.name || 'Unknown error'}`);
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

// Get all users (with optional filters)
export async function getAllUsers(filters: {
  search?: string;
  platform?: string;
  status?: string;
  approvalStatus?: string;
} = {}) {
  try {
    const client = getClient();
    
    // Build filter expression if filters provided
    let filterExpression: string | undefined;
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};
    
    const conditions: string[] = [];
    
    if (filters.platform) {
      expressionAttributeNames['#platform'] = 'platform';
      expressionAttributeValues[':platform'] = filters.platform;
      conditions.push('#platform = :platform');
    }
    
    if (filters.status) {
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = filters.status;
      conditions.push('#status = :status');
    }
    
    if (filters.approvalStatus) {
      expressionAttributeValues[':approvalStatus'] = filters.approvalStatus;
      conditions.push('approvalStatus = :approvalStatus');
    }
    
    if (filters.search) {
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':search'] = filters.search.toLowerCase();
      conditions.push('(contains(#name, :search) OR contains(email, :search) OR contains(phone, :search))');
    }
    
    if (conditions.length > 0) {
      filterExpression = conditions.join(' AND ');
    }
    
    const result = await client.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
    }));
    
    return result.Items || [];
  } catch (error: any) {
    console.error('Error getting all users from DynamoDB:', error);
    
    if (error.name === 'AccessDeniedException' || error.$metadata?.httpStatusCode === 403) {
      throw new Error('AWS Access Denied: Check DynamoDB permissions (Scan, GetItem). Your IAM user needs: dynamodb:Scan, dynamodb:GetItem, dynamodb:PutItem');
    } else if (error.name === 'ResourceNotFoundException') {
      throw new Error(`DynamoDB table "${USERS_TABLE}" not found. Run: node server/setup-dynamodb.js`);
    }
    
    throw new Error(`Failed to get users: ${error.message || error.name || 'Unknown error'}`);
  }
}

// Get links by userId
export async function getLinksByUserId(userId: string) {
  try {
    const client = getClient();
    const result = await client.send(new ScanCommand({
      TableName: LINKS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    return result.Items || [];
  } catch (error: any) {
    console.error('Error getting links by userId:', error);
    return []; // Return empty array on error
  }
}

// Get analytics by userId
export async function getAnalyticsByUserId(userId: string) {
  try {
    const client = getClient();
    const result = await client.send(new ScanCommand({
      TableName: ANALYTICS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    return result.Items || [];
  } catch (error: any) {
    console.error('Error getting analytics by userId:', error);
    return []; // Return empty array on error
  }
}

// Check if DynamoDB is configured
export function isDynamoDBConfigured(): boolean {
  const configured = !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);
  
  // Log configuration status (always log on Vercel to help debug)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('vercel.app') || hostname.includes('adda-millionaire') || hostname.includes('partners-adda');
    const isDevelopment = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    
    if (configured) {
      console.log('✅ DynamoDB configured:', {
        region: AWS_REGION,
        accessKeyId: AWS_ACCESS_KEY_ID ? `${AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'not set',
        secretAccessKey: AWS_SECRET_ACCESS_KEY ? 'set' : 'not set',
        tables: {
          users: USERS_TABLE,
          links: LINKS_TABLE,
          analytics: ANALYTICS_TABLE
        }
      });
    } else {
      if (isProduction) {
        console.error('❌ DynamoDB NOT configured! Form will use backend API.');
        console.error('Set these in Vercel environment variables:');
        console.error('  - VITE_AWS_REGION');
        console.error('  - VITE_AWS_ACCESS_KEY_ID');
        console.error('  - VITE_AWS_SECRET_ACCESS_KEY');
      } else if (isDevelopment) {
        console.warn('⚠️ DynamoDB not configured. Set VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY in .env.local');
      }
    }
  }
  
  return configured;
}

// Update user in DynamoDB
export async function updateUser(userId: string, updates: Record<string, any>) {
  try {
    const client = getClient();
    
    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};
    
    Object.keys(updates).forEach((key, index) => {
      if (updates[key] !== undefined) {
        const attrName = key === 'name' ? '#name' : key;
        if (key === 'name') {
          expressionAttributeNames['#name'] = 'name';
        }
        updateExpressions.push(`${attrName} = :val${index}`);
        expressionAttributeValues[`:val${index}`] = updates[key];
      }
    });
    
    // Always update updatedAt
    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    await client.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));
    
    // Return updated user
    return await getUserById(userId);
  } catch (error: any) {
    console.error('Error updating user in DynamoDB:', error);
    throw new Error(`Failed to update user: ${error.message || error.name || 'Unknown error'}`);
  }
}

// Delete user from DynamoDB
export async function deleteUser(userId: string) {
  try {
    const client = getClient();
    await client.send(new DeleteCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }));
    return true;
  } catch (error: any) {
    console.error('Error deleting user from DynamoDB:', error);
    throw new Error(`Failed to delete user: ${error.message || error.name || 'Unknown error'}`);
  }
}

// Save link to DynamoDB
export async function saveLink(link: any) {
  try {
    const client = getClient();
    await client.send(new PutCommand({
      TableName: LINKS_TABLE,
      Item: {
        id: link.id,
        userId: link.userId,
        ...link,
        createdAt: link.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }));
    return { success: true, link };
  } catch (error: any) {
    console.error('Error saving link to DynamoDB:', error);
    throw new Error(`Failed to save link: ${error.message || error.name || 'Unknown error'}`);
  }
}

// Save analytics to DynamoDB
export async function saveAnalytics(analytics: any) {
  try {
    const client = getClient();
    await client.send(new PutCommand({
      TableName: ANALYTICS_TABLE,
      Item: {
        id: analytics.id,
        userId: analytics.userId,
        linkId: analytics.linkId || null,
        ...analytics,
        createdAt: analytics.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }));
    return { success: true, analytics };
  } catch (error: any) {
    console.error('Error saving analytics to DynamoDB:', error);
    throw new Error(`Failed to save analytics: ${error.message || error.name || 'Unknown error'}`);
  }
}

// Export table names
export { USERS_TABLE, LINKS_TABLE, ANALYTICS_TABLE };
