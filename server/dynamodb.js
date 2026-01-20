import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

// AWS Configuration
// These should be set in environment variables (.env file or deployment platform):
// - AWS_REGION
// - AWS_ACCESS_KEY_ID
// - AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Log configuration status on server startup
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  console.log('✅ DynamoDB configured:', {
    region: AWS_REGION,
    accessKeyId: `${AWS_ACCESS_KEY_ID.substring(0, 8)}...`,
    tables: {
      users: process.env.DYNAMODB_USERS_TABLE || 'edurise-users',
      links: process.env.DYNAMODB_LINKS_TABLE || 'edurise-links',
      analytics: process.env.DYNAMODB_ANALYTICS_TABLE || 'edurise-analytics'
    }
  });
} else {
  console.warn('⚠️ DynamoDB credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables.');
}

// Table names
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'edurise-users';
const LINKS_TABLE = process.env.DYNAMODB_LINKS_TABLE || 'edurise-links';
const ANALYTICS_TABLE = process.env.DYNAMODB_ANALYTICS_TABLE || 'edurise-analytics';

// Initialize DynamoDB Client
const client = new DynamoDBClient({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } : undefined, // Use IAM role if credentials not provided
});

const docClient = DynamoDBDocumentClient.from(client);

// Helper function to save user
export async function saveUser(user) {
  try {
    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        id: user.id,
        ...user,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }));
    return true;
  } catch (error) {
    console.error('Error saving user to DynamoDB:', error);
    throw error;
  }
}

// Helper function to get user by ID
export async function getUserById(userId) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting user from DynamoDB:', error);
    throw error;
  }
}

// Helper function to get user by email
export async function getUserByEmail(email) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase().trim()
      }
    }));
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error) {
    console.error('Error getting user by email from DynamoDB:', error);
    throw error;
  }
}

// Helper function to get user by phone
export async function getUserByPhone(phone) {
  try {
    const phoneDigits = phone.replace(/\D/g, '');
    const result = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'contains(phone, :phone)',
      ExpressionAttributeValues: {
        ':phone': phoneDigits
      }
    }));
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error) {
    console.error('Error getting user by phone from DynamoDB:', error);
    throw error;
  }
}

// Helper function to get all users (with optional filters)
export async function getAllUsers(filters = {}) {
  try {
    let result;
    
    // Build filter expression if filters provided
    if (Object.keys(filters).length > 0) {
      const filterExpressions = [];
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};
      
      if (filters.platform) {
        filterExpressions.push('#platform = :platform');
        expressionAttributeNames['#platform'] = 'platform';
        expressionAttributeValues[':platform'] = filters.platform;
      }
      
      if (filters.status) {
        filterExpressions.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = filters.status;
      }
      
      if (filters.approvalStatus) {
        filterExpressions.push('approvalStatus = :approvalStatus');
        expressionAttributeValues[':approvalStatus'] = filters.approvalStatus;
      }
      
      if (filters.search) {
        filterExpressions.push('(contains(#name, :search) OR contains(email, :search) OR contains(phone, :search))');
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[':search'] = filters.search;
      }
      
      result = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: filterExpressions.join(' AND '),
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: expressionAttributeValues
      }));
    } else {
      result = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE
      }));
    }
    
    return result.Items || [];
  } catch (error) {
    console.error('Error getting all users from DynamoDB:', error);
    throw error;
  }
}

// Helper function to update user
export async function updateUser(userId, updates) {
  try {
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};
    
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
    
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));
    
    return await getUserById(userId);
  } catch (error) {
    console.error('Error updating user in DynamoDB:', error);
    throw error;
  }
}

// Helper function to delete user
export async function deleteUser(userId) {
  try {
    await docClient.send(new DeleteCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }));
    return true;
  } catch (error) {
    console.error('Error deleting user from DynamoDB:', error);
    throw error;
  }
}

// Helper function to save link
export async function saveLink(link) {
  try {
    await docClient.send(new PutCommand({
      TableName: LINKS_TABLE,
      Item: {
        id: link.id || link.linkId,
        userId: link.userId,
        link: link.link,
        linkId: link.linkId,
        ...link,
        createdAt: link.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }));
    return true;
  } catch (error) {
    console.error('Error saving link to DynamoDB:', error);
    throw error;
  }
}

// Helper function to get link by ID
export async function getLinkById(linkId) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: LINKS_TABLE,
      Key: { id: linkId }
    }));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting link from DynamoDB:', error);
    throw error;
  }
}

// Helper function to get links by userId
export async function getLinksByUserId(userId) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: LINKS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting links by userId from DynamoDB:', error);
    throw error;
  }
}

// Helper function to get all links
export async function getAllLinks() {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: LINKS_TABLE
    }));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting all links from DynamoDB:', error);
    throw error;
  }
}

// Helper function to save analytics
export async function saveAnalytics(analytics) {
  try {
    await docClient.send(new PutCommand({
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
    return true;
  } catch (error) {
    console.error('Error saving analytics to DynamoDB:', error);
    throw error;
  }
}

// Helper function to get analytics by userId
export async function getAnalyticsByUserId(userId) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: ANALYTICS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting analytics by userId from DynamoDB:', error);
    throw error;
  }
}

// Helper function to get analytics by linkId
export async function getAnalyticsByLinkId(linkId) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: ANALYTICS_TABLE,
      FilterExpression: 'linkId = :linkId',
      ExpressionAttributeValues: {
        ':linkId': linkId
      }
    }));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting analytics by linkId from DynamoDB:', error);
    throw error;
  }
}

// Helper function to get all analytics
export async function getAllAnalytics(filters = {}) {
  try {
    let result;
    
    if (filters.userId) {
      result = await docClient.send(new ScanCommand({
        TableName: ANALYTICS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': filters.userId
        }
      }));
    } else {
      result = await docClient.send(new ScanCommand({
        TableName: ANALYTICS_TABLE
      }));
    }
    
    return result.Items || [];
  } catch (error) {
    console.error('Error getting all analytics from DynamoDB:', error);
    throw error;
  }
}

// Export table names for reference
export { USERS_TABLE, LINKS_TABLE, ANALYTICS_TABLE };
