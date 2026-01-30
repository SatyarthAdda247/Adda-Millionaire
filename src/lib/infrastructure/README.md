# API Integration Reliability - Infrastructure

This directory contains the core infrastructure components for the API Integration Reliability system, implementing the foundational layers for reliable AppTrove API integration.

## Overview

The infrastructure provides:

- **TypeScript Interfaces**: Comprehensive type definitions for all system components
- **DynamoDB Integration**: Single-table design with efficient query patterns
- **Environment Management**: Robust configuration validation and management
- **Structured Logging**: Production-ready logging with context tracking

## Architecture

```
src/lib/infrastructure/
├── types/                 # TypeScript interfaces and type definitions
│   └── index.ts          # Core types for all system components
├── database/             # DynamoDB integration
│   ├── schemas.ts        # Table schemas and data transformations
│   └── connection.ts     # Connection management and operations
├── config/               # Configuration management
│   └── environment.ts    # Environment variable validation
├── logging/              # Structured logging
│   └── logger.ts         # Logger implementation with transports
├── init.ts               # Infrastructure initialization
├── test-infrastructure.ts # Infrastructure testing
└── index.ts              # Main exports
```

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual AppTrove API credentials and configuration.

### 2. Initialize Infrastructure

```typescript
import { initializeInfrastructure } from './lib/infrastructure';

async function main() {
  try {
    const config = await initializeInfrastructure();
    console.log('Infrastructure ready!');
    
    // Use the configured components
    config.logger.info('Application started');
    
    // Database operations
    const dbOps = new DatabaseOperations(config.database, config.logger);
    
  } catch (error) {
    console.error('Failed to initialize infrastructure:', error);
    process.exit(1);
  }
}
```

### 3. Test Infrastructure

Run the infrastructure tests to validate your setup:

```bash
npm run test:infrastructure
```

Or programmatically:

```typescript
import { testInfrastructure } from './lib/infrastructure/test-infrastructure';

await testInfrastructure();
```

## Components

### Types System

Comprehensive TypeScript interfaces for all system components:

- **Data Models**: `AffiliateUser`, `AffiliateLink`, `Template`, `LinkStats`
- **API Types**: `APIRequest`, `APIResponse`, `APIError`, `APICredentials`
- **Configuration**: `EnvironmentConfig`, `CircuitBreakerConfig`, `RetryConfig`
- **Component Interfaces**: All service interfaces from the design document

### Database Layer

Single-table DynamoDB design with:

- **Efficient Access Patterns**: Optimized for common query patterns
- **Strong Consistency**: For critical operations
- **Automatic Scaling**: Pay-per-request billing
- **TTL Support**: Automatic cleanup of temporary data

#### Key Patterns

```typescript
// User operations
const userPK = KeyGenerator.userPK('user-123');
const userSK = KeyGenerator.userProfileSK();

// Link operations  
const linkSK = KeyGenerator.userLinkSK('link-456');

// Query patterns
const userLinks = QueryPatterns.getUserLinks(tableName, 'user-123');
const activeTemplates = QueryPatterns.getActiveTemplates(tableName);
```

### Configuration Management

Robust environment variable validation:

- **Required Variables**: AppTrove credentials, database config, admin email
- **Optional Variables**: Circuit breaker settings, retry configuration
- **Validation**: Format validation, range checking, credential verification
- **Error Reporting**: Clear error messages for missing/invalid configuration

### Structured Logging

Production-ready logging with:

- **Multiple Transports**: Console, file, external services
- **Structured Data**: JSON formatting for production
- **Context Tracking**: Request IDs, user IDs, operation context
- **Performance Monitoring**: Duration tracking, API call logging

#### Usage Examples

```typescript
// Basic logging
logger.info('Operation completed', { userId: '123', duration: 150 });

// Error logging with context
logger.error('API call failed', error, { endpoint: '/api/links', attempt: 2 });

// Request context
logger.setRequestId('req-123');
logger.setUserId('user-456');
logger.info('Processing request'); // Automatically includes context

// API call logging
logger.logAPICall('/api/create-link', 'POST', 250, 201, undefined, { templateId: 'tmpl-123' });
```

## Configuration

### Required Environment Variables

```bash
# AppTrove API Credentials
APPTROVE_SDK_KEY=your_sdk_key
APPTROVE_S2S_API_KEY=your_s2s_key  
APPTROVE_SECRET_ID=your_secret_id
APPTROVE_SECRET_KEY=your_secret_key
APPTROVE_REPORTING_API_KEY=your_reporting_key

# Database Configuration
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=api-integration-reliability

# Admin Configuration
ADMIN_EMAIL=admin@example.com
```

### Optional Configuration

```bash
# System Configuration
NODE_ENV=development
LOG_LEVEL=info

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60000

# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=10000

# Monitoring
HEALTH_CHECK_INTERVAL=300000
ANALYTICS_SYNC_INTERVAL=900000
```

## Database Schema

### Single Table Design

The system uses a single DynamoDB table with the following structure:

```
Table: {DYNAMODB_TABLE_PREFIX}-main
PK (Hash Key): Entity identifier
SK (Range Key): Entity type/relationship
GSI1PK/GSI1SK: Status-based queries
GSI2PK/GSI2SK: Category-based queries
TTL: Automatic cleanup for temporary data
```

### Access Patterns

1. **Get user profile**: `PK=USER#123, SK=PROFILE`
2. **Get user links**: `PK=USER#123, SK begins_with LINK#`
3. **Get users by status**: `GSI1PK=USER#STATUS#approved`
4. **Get templates by category**: `GSI2PK=CATEGORY#ecommerce`
5. **Get health metrics**: `PK=ENDPOINT#/api/links, SK begins_with METRIC#`

## Health Monitoring

The infrastructure includes comprehensive health checking:

```typescript
import { performHealthCheck } from './lib/infrastructure';

const health = await performHealthCheck();
console.log('System healthy:', health.healthy);
console.log('Environment:', health.checks.environment);
console.log('Database:', health.checks.database);
console.log('Logging:', health.checks.logging);
```

## Error Handling

The infrastructure implements comprehensive error handling:

- **Configuration Errors**: Clear messages for missing/invalid environment variables
- **Database Errors**: Connection failures, timeout handling, retry logic
- **Logging Errors**: Fallback mechanisms, transport failure handling
- **Validation Errors**: Detailed validation results with specific error messages

## Testing

### Infrastructure Tests

Run comprehensive infrastructure tests:

```bash
# Test all components
npm run test:infrastructure

# Test specific components
npm run test:config
npm run test:database
npm run test:logging
```

### Manual Testing

```typescript
import { testInfrastructure } from './lib/infrastructure/test-infrastructure';

// Run all infrastructure tests
await testInfrastructure();
```

## Performance Considerations

- **Database**: Single-table design minimizes cross-table joins
- **Logging**: Asynchronous transports prevent blocking
- **Configuration**: Singleton pattern prevents repeated validation
- **Connection Pooling**: Reused DynamoDB connections

## Security

- **Credential Management**: Sensitive values masked in logs
- **Environment Validation**: Prevents placeholder/test credentials in production
- **Access Patterns**: Least-privilege database access patterns
- **Logging**: Automatic sanitization of sensitive data

## Troubleshooting

### Common Issues

1. **Environment Validation Fails**
   - Check `.env` file exists and has correct values
   - Verify AppTrove credentials are not placeholder values
   - Ensure admin email is valid format

2. **Database Connection Fails**
   - Verify AWS credentials and region
   - Check DynamoDB table exists
   - Confirm network connectivity

3. **Logging Issues**
   - Check log level configuration
   - Verify file permissions for file transport
   - Check console output for transport errors

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
LOG_LEVEL=debug npm start
```

## Next Steps

After setting up the infrastructure:

1. **Implement Reliability Layer**: Circuit breakers, retry engines, fallback systems
2. **Add Business Logic**: Link creation, template management, analytics sync
3. **Set Up Monitoring**: Health dashboards, alerting, metrics collection
4. **Deploy Infrastructure**: Production database setup, environment configuration

## Support

For issues with the infrastructure setup:

1. Check the troubleshooting section above
2. Run infrastructure tests to identify specific failures
3. Review logs for detailed error information
4. Verify environment configuration matches requirements