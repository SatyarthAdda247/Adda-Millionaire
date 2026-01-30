/**
 * DynamoDB connection utilities and client configuration
 * Provides configured DynamoDB clients and connection management
 */

import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
  TransactWriteCommand,
  TransactGetCommand
} from '@aws-sdk/lib-dynamodb';
import { EnvironmentConfig, Logger, LogLevel } from '../types';

// ============================================================================
// Connection Configuration
// ============================================================================

export interface DynamoDBConfig {
  region: string;
  tablePrefix: string;
  endpoint?: string; // For local development
  maxRetries?: number;
  timeout?: number;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class DynamoDBConnection {
  private static instance: DynamoDBConnection;
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private config: DynamoDBConfig;
  private logger: Logger;

  private constructor(config: DynamoDBConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.initializeClients();
  }

  /**
   * Get singleton instance of DynamoDB connection
   */
  static getInstance(config: DynamoDBConfig, logger: Logger): DynamoDBConnection {
    if (!DynamoDBConnection.instance) {
      DynamoDBConnection.instance = new DynamoDBConnection(config, logger);
    }
    return DynamoDBConnection.instance;
  }

  /**
   * Initialize DynamoDB clients with configuration
   */
  private initializeClients(): void {
    const clientConfig: DynamoDBClientConfig = {
      region: this.config.region,
      maxAttempts: this.config.maxRetries || 3,
    };

    // Add endpoint for local development
    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint;
    }

    // Add credentials if provided
    if (this.config.credentials) {
      clientConfig.credentials = this.config.credentials;
    }

    this.client = new DynamoDBClient(clientConfig);
    this.docClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });

    this.logger.info('DynamoDB clients initialized', {
      region: this.config.region,
      tablePrefix: this.config.tablePrefix,
      hasEndpoint: !!this.config.endpoint,
      hasCredentials: !!this.config.credentials
    });
  }

  /**
   * Get the raw DynamoDB client
   */
  getClient(): DynamoDBClient {
    return this.client;
  }

  /**
   * Get the document client (recommended for most operations)
   */
  getDocumentClient(): DynamoDBDocumentClient {
    return this.docClient;
  }

  /**
   * Get table name with prefix
   */
  getTableName(baseName: string = 'main'): string {
    return `${this.config.tablePrefix}-${baseName}`;
  }

  /**
   * Test connection to DynamoDB
   */
  async testConnection(): Promise<boolean> {
    try {
      const tableName = this.getTableName();
      
      // Try to describe the table (this will fail if table doesn't exist or connection is bad)
      await this.docClient.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'CONNECTION_TEST'
        },
        Limit: 1
      }));

      this.logger.info('DynamoDB connection test successful');
      return true;
    } catch (error) {
      this.logger.error('DynamoDB connection test failed', error as Error, {
        tableName: this.getTableName(),
        region: this.config.region
      });
      return false;
    }
  }

  /**
   * Close the connection (cleanup)
   */
  async close(): Promise<void> {
    try {
      this.client.destroy();
      this.logger.info('DynamoDB connection closed');
    } catch (error) {
      this.logger.error('Error closing DynamoDB connection', error as Error);
    }
  }
}

// ============================================================================
// Database Operations Wrapper
// ============================================================================

export class DatabaseOperations {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;
  private logger: Logger;

  constructor(connection: DynamoDBConnection, logger: Logger) {
    this.docClient = connection.getDocumentClient();
    this.tableName = connection.getTableName();
    this.logger = logger;
  }

  /**
   * Get a single item by primary key
   */
  async getItem<T>(pk: string, sk: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const result = await this.docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
        ConsistentRead: true
      }));

      const duration = Date.now() - startTime;
      this.logger.debug('DynamoDB GetItem completed', {
        pk,
        sk,
        duration,
        found: !!result.Item
      });

      return result.Item as T || null;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('DynamoDB GetItem failed', error as Error, {
        pk,
        sk,
        duration
      });
      throw error;
    }
  }

  /**
   * Put an item (create or replace)
   */
  async putItem<T>(item: T): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: item
      }));

      const duration = Date.now() - startTime;
      this.logger.debug('DynamoDB PutItem completed', {
        duration,
        itemType: (item as any).entityType
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('DynamoDB PutItem failed', error as Error, {
        duration,
        itemType: (item as any).entityType
      });
      throw error;
    }
  }

  /**
   * Update an item
   */
  async updateItem(
    pk: string, 
    sk: string, 
    updateExpression: string, 
    expressionAttributeNames?: Record<string, string>,
    expressionAttributeValues?: Record<string, any>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      }));

      const duration = Date.now() - startTime;
      this.logger.debug('DynamoDB UpdateItem completed', {
        pk,
        sk,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('DynamoDB UpdateItem failed', error as Error, {
        pk,
        sk,
        duration
      });
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(pk: string, sk: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk }
      }));

      const duration = Date.now() - startTime;
      this.logger.debug('DynamoDB DeleteItem completed', {
        pk,
        sk,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('DynamoDB DeleteItem failed', error as Error, {
        pk,
        sk,
        duration
      });
      throw error;
    }
  }

  /**
   * Query items
   */
  async queryItems<T>(
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    options?: {
      indexName?: string;
      filterExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      scanIndexForward?: boolean;
      limit?: number;
      exclusiveStartKey?: Record<string, any>;
    }
  ): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, any> }> {
    const startTime = Date.now();
    
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: options?.indexName,
        KeyConditionExpression: keyConditionExpression,
        FilterExpression: options?.filterExpression,
        ExpressionAttributeNames: options?.expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ScanIndexForward: options?.scanIndexForward,
        Limit: options?.limit,
        ExclusiveStartKey: options?.exclusiveStartKey
      }));

      const duration = Date.now() - startTime;
      this.logger.debug('DynamoDB Query completed', {
        duration,
        itemCount: result.Items?.length || 0,
        hasMoreResults: !!result.LastEvaluatedKey,
        indexName: options?.indexName
      });

      return {
        items: (result.Items as T[]) || [],
        lastEvaluatedKey: result.LastEvaluatedKey
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('DynamoDB Query failed', error as Error, {
        duration,
        indexName: options?.indexName
      });
      throw error;
    }
  }

  /**
   * Batch get items
   */
  async batchGetItems<T>(keys: Array<{ PK: string; SK: string }>): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      const result = await this.docClient.send(new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: keys
          }
        }
      }));

      const duration = Date.now() - startTime;
      const items = result.Responses?.[this.tableName] as T[] || [];
      
      this.logger.debug('DynamoDB BatchGet completed', {
        duration,
        requestedCount: keys.length,
        returnedCount: items.length
      });

      return items;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('DynamoDB BatchGet failed', error as Error, {
        duration,
        requestedCount: keys.length
      });
      throw error;
    }
  }

  /**
   * Batch write items (put or delete)
   */
  async batchWriteItems(
    putItems?: any[],
    deleteKeys?: Array<{ PK: string; SK: string }>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const requestItems: any[] = [];
      
      if (putItems) {
        requestItems.push(...putItems.map(item => ({ PutRequest: { Item: item } })));
      }
      
      if (deleteKeys) {
        requestItems.push(...deleteKeys.map(key => ({ DeleteRequest: { Key: key } })));
      }

      await this.docClient.send(new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: requestItems
        }
      }));

      const duration = Date.now() - startTime;
      this.logger.debug('DynamoDB BatchWrite completed', {
        duration,
        putCount: putItems?.length || 0,
        deleteCount: deleteKeys?.length || 0
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('DynamoDB BatchWrite failed', error as Error, {
        duration,
        putCount: putItems?.length || 0,
        deleteCount: deleteKeys?.length || 0
      });
      throw error;
    }
  }

  /**
   * Transaction write (atomic operations)
   */
  async transactWrite(transactItems: any[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.docClient.send(new TransactWriteCommand({
        TransactItems: transactItems
      }));

      const duration = Date.now() - startTime;
      this.logger.debug('DynamoDB TransactWrite completed', {
        duration,
        itemCount: transactItems.length
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('DynamoDB TransactWrite failed', error as Error, {
        duration,
        itemCount: transactItems.length
      });
      throw error;
    }
  }
}

// ============================================================================
// Configuration Factory
// ============================================================================

export class DynamoDBConfigFactory {
  /**
   * Create DynamoDB configuration from environment variables
   */
  static fromEnvironment(env: EnvironmentConfig): DynamoDBConfig {
    return {
      region: env.AWS_REGION,
      tablePrefix: env.DYNAMODB_TABLE_PREFIX,
      endpoint: env.NODE_ENV === 'development' ? 'http://localhost:8000' : undefined,
      maxRetries: 3,
      timeout: 30000
    };
  }

  /**
   * Create configuration for local development
   */
  static forLocalDevelopment(tablePrefix: string = 'dev-api-integration'): DynamoDBConfig {
    return {
      region: 'us-east-1',
      tablePrefix,
      endpoint: 'http://localhost:8000',
      maxRetries: 2,
      timeout: 10000,
      credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
      }
    };
  }

  /**
   * Create configuration for testing
   */
  static forTesting(tablePrefix: string = 'test-api-integration'): DynamoDBConfig {
    return {
      region: 'us-east-1',
      tablePrefix,
      endpoint: 'http://localhost:8000',
      maxRetries: 1,
      timeout: 5000,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      }
    };
  }
}