/**
 * DynamoDB table schemas and data access patterns
 * Implements single-table design with composite keys for efficient queries
 */

import { 
  AffiliateUser, 
  AffiliateLink, 
  Template, 
  APIHealthMetrics, 
  LinkCreationRequest,
  LinkStats,
  UserStatus,
  LinkStatus,
  EndpointStatus,
  RequestStatus
} from '../types';

// ============================================================================
// DynamoDB Item Types (with DynamoDB-specific attributes)
// ============================================================================

export interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  TTL?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateUserItem extends DynamoDBItem {
  entityType: 'USER';
  email: string;
  status: UserStatus;
  approvedAt?: string;
}

export interface AffiliateLinkItem extends DynamoDBItem {
  entityType: 'LINK';
  userId: string;
  templateId: string;
  trackingUrl: string;
  status: LinkStatus;
  appTroveId?: string;
}

export interface TemplateItem extends DynamoDBItem {
  entityType: 'TEMPLATE';
  name: string;
  category: string;
  isActive: boolean;
  lastUpdated: string;
}

export interface HealthMetricsItem extends DynamoDBItem {
  entityType: 'HEALTH_METRIC';
  endpoint: string;
  successRate: number;
  averageLatency: number;
  lastChecked: string;
  consecutiveFailures: number;
  status: EndpointStatus;
}

export interface FailedRequestItem extends DynamoDBItem {
  entityType: 'FAILED_REQUEST';
  userId: string;
  templateId: string;
  requestId: string;
  attempts: number;
  lastAttempt: string;
  status: RequestStatus;
  error?: string;
}

export interface LinkStatsItem extends DynamoDBItem {
  entityType: 'LINK_STATS';
  linkId: string;
  clicks: number;
  conversions: number;
  revenue: number;
  lastUpdated: string;
}

// ============================================================================
// Key Generation Utilities
// ============================================================================

export class KeyGenerator {
  /**
   * Generate primary key for affiliate user
   */
  static userPK(userId: string): string {
    return `USER#${userId}`;
  }

  /**
   * Generate sort key for user profile
   */
  static userProfileSK(): string {
    return 'PROFILE';
  }

  /**
   * Generate sort key for user link
   */
  static userLinkSK(linkId: string): string {
    return `LINK#${linkId}`;
  }

  /**
   * Generate primary key for template
   */
  static templatePK(templateId: string): string {
    return `TEMPLATE#${templateId}`;
  }

  /**
   * Generate sort key for template metadata
   */
  static templateMetadataSK(): string {
    return 'METADATA';
  }

  /**
   * Generate primary key for health metrics
   */
  static healthMetricsPK(endpoint: string): string {
    return `ENDPOINT#${endpoint}`;
  }

  /**
   * Generate sort key for health metrics with timestamp
   */
  static healthMetricsSK(timestamp: Date): string {
    return `METRIC#${timestamp.toISOString()}`;
  }

  /**
   * Generate primary key for failed request
   */
  static failedRequestPK(requestId: string): string {
    return `REQUEST#${requestId}`;
  }

  /**
   * Generate sort key for failed request attempt
   */
  static failedRequestSK(timestamp: Date): string {
    return `ATTEMPT#${timestamp.toISOString()}`;
  }

  /**
   * Generate primary key for link stats
   */
  static linkStatsPK(linkId: string): string {
    return `STATS#${linkId}`;
  }

  /**
   * Generate sort key for link stats with timestamp
   */
  static linkStatsSK(timestamp: Date): string {
    return `PERIOD#${timestamp.toISOString()}`;
  }

  /**
   * Generate GSI1 keys for status-based queries
   */
  static statusGSI1Keys(entityType: string, status: string): { GSI1PK: string; GSI1SK: string } {
    return {
      GSI1PK: `${entityType}#STATUS#${status}`,
      GSI1SK: new Date().toISOString()
    };
  }

  /**
   * Generate GSI2 keys for category-based queries
   */
  static categoryGSI2Keys(category: string, entityId: string): { GSI2PK: string; GSI2SK: string } {
    return {
      GSI2PK: `CATEGORY#${category}`,
      GSI2SK: entityId
    };
  }
}

// ============================================================================
// Data Transformation Utilities
// ============================================================================

export class DataTransformer {
  /**
   * Convert AffiliateUser to DynamoDB item
   */
  static userToDynamoItem(user: AffiliateUser): AffiliateUserItem {
    const now = new Date().toISOString();
    return {
      PK: KeyGenerator.userPK(user.id),
      SK: KeyGenerator.userProfileSK(),
      ...KeyGenerator.statusGSI1Keys('USER', user.status),
      entityType: 'USER',
      email: user.email,
      status: user.status,
      approvedAt: user.approvedAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  /**
   * Convert DynamoDB item to AffiliateUser
   */
  static dynamoItemToUser(item: AffiliateUserItem, links: AffiliateLink[] = []): AffiliateUser {
    return {
      id: item.PK.replace('USER#', ''),
      email: item.email,
      status: item.status,
      approvedAt: item.approvedAt ? new Date(item.approvedAt) : undefined,
      links,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    };
  }

  /**
   * Convert AffiliateLink to DynamoDB item
   */
  static linkToDynamoItem(link: AffiliateLink): AffiliateLinkItem {
    return {
      PK: KeyGenerator.userPK(link.userId),
      SK: KeyGenerator.userLinkSK(link.id),
      ...KeyGenerator.statusGSI1Keys('LINK', link.status),
      entityType: 'LINK',
      userId: link.userId,
      templateId: link.templateId,
      trackingUrl: link.trackingUrl,
      status: link.status,
      appTroveId: link.appTroveId,
      createdAt: link.createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Convert DynamoDB item to AffiliateLink
   */
  static dynamoItemToLink(item: AffiliateLinkItem): AffiliateLink {
    return {
      id: item.SK.replace('LINK#', ''),
      userId: item.userId,
      templateId: item.templateId,
      trackingUrl: item.trackingUrl,
      status: item.status,
      appTroveId: item.appTroveId,
      createdAt: new Date(item.createdAt)
    };
  }

  /**
   * Convert Template to DynamoDB item
   */
  static templateToDynamoItem(template: Template): TemplateItem {
    return {
      PK: KeyGenerator.templatePK(template.id),
      SK: KeyGenerator.templateMetadataSK(),
      ...KeyGenerator.categoryGSI2Keys(template.category, template.id),
      entityType: 'TEMPLATE',
      name: template.name,
      category: template.category,
      isActive: template.isActive,
      lastUpdated: template.lastUpdated.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Convert DynamoDB item to Template
   */
  static dynamoItemToTemplate(item: TemplateItem): Template {
    return {
      id: item.PK.replace('TEMPLATE#', ''),
      name: item.name,
      category: item.category,
      isActive: item.isActive,
      lastUpdated: new Date(item.lastUpdated)
    };
  }

  /**
   * Convert APIHealthMetrics to DynamoDB item
   */
  static healthMetricsToDynamoItem(metrics: APIHealthMetrics): HealthMetricsItem {
    const timestamp = new Date();
    return {
      PK: KeyGenerator.healthMetricsPK(metrics.endpoint),
      SK: KeyGenerator.healthMetricsSK(timestamp),
      ...KeyGenerator.statusGSI1Keys('HEALTH_METRIC', metrics.status),
      entityType: 'HEALTH_METRIC',
      endpoint: metrics.endpoint,
      successRate: metrics.successRate,
      averageLatency: metrics.averageLatency,
      lastChecked: metrics.lastChecked.toISOString(),
      consecutiveFailures: metrics.consecutiveFailures,
      status: metrics.status,
      TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString()
    };
  }

  /**
   * Convert DynamoDB item to APIHealthMetrics
   */
  static dynamoItemToHealthMetrics(item: HealthMetricsItem): APIHealthMetrics {
    return {
      endpoint: item.endpoint,
      successRate: item.successRate,
      averageLatency: item.averageLatency,
      lastChecked: new Date(item.lastChecked),
      consecutiveFailures: item.consecutiveFailures,
      status: item.status
    };
  }

  /**
   * Convert LinkCreationRequest to DynamoDB item
   */
  static failedRequestToDynamoItem(request: LinkCreationRequest): FailedRequestItem {
    const timestamp = new Date();
    return {
      PK: KeyGenerator.failedRequestPK(request.requestId),
      SK: KeyGenerator.failedRequestSK(timestamp),
      ...KeyGenerator.statusGSI1Keys('FAILED_REQUEST', request.status),
      entityType: 'FAILED_REQUEST',
      userId: request.userId,
      templateId: request.templateId,
      requestId: request.requestId,
      attempts: request.attempts,
      lastAttempt: request.lastAttempt.toISOString(),
      status: request.status,
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString()
    };
  }

  /**
   * Convert DynamoDB item to LinkCreationRequest
   */
  static dynamoItemToFailedRequest(item: FailedRequestItem): LinkCreationRequest {
    return {
      userId: item.userId,
      templateId: item.templateId,
      requestId: item.requestId,
      attempts: item.attempts,
      lastAttempt: new Date(item.lastAttempt),
      status: item.status
    };
  }

  /**
   * Convert LinkStats to DynamoDB item
   */
  static linkStatsToDynamoItem(stats: LinkStats): LinkStatsItem {
    const timestamp = new Date();
    return {
      PK: KeyGenerator.linkStatsPK(stats.linkId),
      SK: KeyGenerator.linkStatsSK(timestamp),
      entityType: 'LINK_STATS',
      linkId: stats.linkId,
      clicks: stats.clicks,
      conversions: stats.conversions,
      revenue: stats.revenue,
      lastUpdated: stats.lastUpdated.toISOString(),
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString()
    };
  }

  /**
   * Convert DynamoDB item to LinkStats
   */
  static dynamoItemToLinkStats(item: LinkStatsItem): LinkStats {
    return {
      linkId: item.linkId,
      clicks: item.clicks,
      conversions: item.conversions,
      revenue: item.revenue,
      lastUpdated: new Date(item.lastUpdated)
    };
  }
}

// ============================================================================
// Query Patterns
// ============================================================================

export interface QueryPattern {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, any>;
  FilterExpression?: string;
  ScanIndexForward?: boolean;
  Limit?: number;
}

export class QueryPatterns {
  /**
   * Get user profile by ID
   */
  static getUserProfile(tableName: string, userId: string): QueryPattern {
    return {
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': KeyGenerator.userPK(userId),
        ':sk': KeyGenerator.userProfileSK()
      }
    };
  }

  /**
   * Get all links for a user
   */
  static getUserLinks(tableName: string, userId: string): QueryPattern {
    return {
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
      ExpressionAttributeValues: {
        ':pk': KeyGenerator.userPK(userId),
        ':sk_prefix': 'LINK#'
      }
    };
  }

  /**
   * Get users by status
   */
  static getUsersByStatus(tableName: string, status: UserStatus): QueryPattern {
    return {
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `USER#STATUS#${status}`
      },
      ScanIndexForward: false // Most recent first
    };
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(tableName: string, category: string): QueryPattern {
    return {
      TableName: tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: {
        ':gsi2pk': `CATEGORY#${category}`
      }
    };
  }

  /**
   * Get active templates
   */
  static getActiveTemplates(tableName: string): QueryPattern {
    return {
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: {
        ':gsi1pk': 'TEMPLATE#STATUS#active',
        ':active': true
      }
    };
  }

  /**
   * Get recent health metrics for endpoint
   */
  static getRecentHealthMetrics(tableName: string, endpoint: string, limit: number = 10): QueryPattern {
    return {
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
      ExpressionAttributeValues: {
        ':pk': KeyGenerator.healthMetricsPK(endpoint),
        ':sk_prefix': 'METRIC#'
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit
    };
  }

  /**
   * Get failed requests by status
   */
  static getFailedRequestsByStatus(tableName: string, status: RequestStatus): QueryPattern {
    return {
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `FAILED_REQUEST#STATUS#${status}`
      },
      ScanIndexForward: false // Most recent first
    };
  }

  /**
   * Get link stats for a specific link
   */
  static getLinkStats(tableName: string, linkId: string, limit: number = 30): QueryPattern {
    return {
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
      ExpressionAttributeValues: {
        ':pk': KeyGenerator.linkStatsPK(linkId),
        ':sk_prefix': 'PERIOD#'
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit
    };
  }
}

// ============================================================================
// Table Configuration
// ============================================================================

export interface TableConfig {
  TableName: string;
  BillingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
  AttributeDefinitions: Array<{
    AttributeName: string;
    AttributeType: 'S' | 'N' | 'B';
  }>;
  KeySchema: Array<{
    AttributeName: string;
    KeyType: 'HASH' | 'RANGE';
  }>;
  GlobalSecondaryIndexes?: Array<{
    IndexName: string;
    KeySchema: Array<{
      AttributeName: string;
      KeyType: 'HASH' | 'RANGE';
    }>;
    Projection: {
      ProjectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE';
      NonKeyAttributes?: string[];
    };
  }>;
  TimeToLiveSpecification?: {
    AttributeName: string;
    Enabled: boolean;
  };
  StreamSpecification?: {
    StreamEnabled: boolean;
    StreamViewType: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES';
  };
}

export const TABLE_CONFIG: TableConfig = {
  TableName: 'api-integration-reliability',
  BillingMode: 'PAY_PER_REQUEST',
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'GSI1PK', AttributeType: 'S' },
    { AttributeName: 'GSI1SK', AttributeType: 'S' },
    { AttributeName: 'GSI2PK', AttributeType: 'S' },
    { AttributeName: 'GSI2SK', AttributeType: 'S' }
  ],
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },
    { AttributeName: 'SK', KeyType: 'RANGE' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1SK', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'GSI2',
      KeySchema: [
        { AttributeName: 'GSI2PK', KeyType: 'HASH' },
        { AttributeName: 'GSI2SK', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  TimeToLiveSpecification: {
    AttributeName: 'TTL',
    Enabled: true
  },
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_AND_OLD_IMAGES'
  }
};