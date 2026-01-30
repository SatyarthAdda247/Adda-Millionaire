/**
 * Infrastructure testing and validation script
 * Tests all infrastructure components to ensure they work correctly
 */

import {
  initializeInfrastructure,
  performHealthCheck,
  cleanupInfrastructure,
  LogLevel,
  UserStatus,
  LinkStatus,
  KeyGenerator,
  DataTransformer,
  AffiliateUser,
  AffiliateLink
} from './index';

// ============================================================================
// Test Infrastructure Components
// ============================================================================

async function testInfrastructure(): Promise<void> {
  console.log('🧪 Starting infrastructure tests...\n');

  try {
    // Test 1: Initialize infrastructure
    console.log('Test 1: Infrastructure Initialization');
    console.log('=====================================');
    
    const config = await initializeInfrastructure();
    console.log('✅ Infrastructure initialized successfully');
    console.log(`   - Environment: ${config.environment.NODE_ENV}`);
    console.log(`   - Log Level: ${config.environment.LOG_LEVEL}`);
    console.log(`   - AWS Region: ${config.environment.AWS_REGION}`);
    console.log(`   - Table Prefix: ${config.environment.DYNAMODB_TABLE_PREFIX}\n`);

    // Test 2: Logging functionality
    console.log('Test 2: Logging Infrastructure');
    console.log('===============================');
    
    config.logger.debug('Debug message test', { testData: 'debug' });
    config.logger.info('Info message test', { testData: 'info' });
    config.logger.warn('Warning message test', { testData: 'warning' });
    
    // Test error logging
    try {
      throw new Error('Test error for logging');
    } catch (error) {
      config.logger.error('Error message test', error as Error, { testData: 'error' });
    }
    
    console.log('✅ Logging tests completed\n');

    // Test 3: Database schema utilities
    console.log('Test 3: Database Schema Utilities');
    console.log('==================================');
    
    // Test key generation
    const userId = 'test-user-123';
    const linkId = 'test-link-456';
    const templateId = 'test-template-789';
    
    const userPK = KeyGenerator.userPK(userId);
    const userSK = KeyGenerator.userProfileSK();
    const linkSK = KeyGenerator.userLinkSK(linkId);
    const templatePK = KeyGenerator.templatePK(templateId);
    
    console.log('✅ Key generation tests:');
    console.log(`   - User PK: ${userPK}`);
    console.log(`   - User SK: ${userSK}`);
    console.log(`   - Link SK: ${linkSK}`);
    console.log(`   - Template PK: ${templatePK}`);

    // Test data transformation
    const testUser: AffiliateUser = {
      id: userId,
      email: 'test@example.com',
      status: UserStatus.APPROVED,
      approvedAt: new Date(),
      links: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const testLink: AffiliateLink = {
      id: linkId,
      userId: userId,
      templateId: templateId,
      trackingUrl: 'https://example.com/track/123',
      status: LinkStatus.ACTIVE,
      appTroveId: 'apptrove-123',
      createdAt: new Date()
    };

    const userItem = DataTransformer.userToDynamoItem(testUser);
    const linkItem = DataTransformer.linkToDynamoItem(testLink);
    
    console.log('✅ Data transformation tests:');
    console.log(`   - User item PK: ${userItem.PK}`);
    console.log(`   - User item entity type: ${userItem.entityType}`);
    console.log(`   - Link item PK: ${linkItem.PK}`);
    console.log(`   - Link item entity type: ${linkItem.entityType}`);

    // Test reverse transformation
    const transformedUser = DataTransformer.dynamoItemToUser(userItem);
    const transformedLink = DataTransformer.dynamoItemToLink(linkItem);
    
    console.log('✅ Reverse transformation tests:');
    console.log(`   - User ID matches: ${transformedUser.id === testUser.id}`);
    console.log(`   - User email matches: ${transformedUser.email === testUser.email}`);
    console.log(`   - Link ID matches: ${transformedLink.id === testLink.id}`);
    console.log(`   - Link URL matches: ${transformedLink.trackingUrl === testLink.trackingUrl}\n`);

    // Test 4: Configuration validation
    console.log('Test 4: Configuration Validation');
    console.log('=================================');
    
    console.log('✅ Environment configuration:');
    console.log(`   - Node environment: ${config.environment.NODE_ENV}`);
    console.log(`   - AWS region: ${config.environment.AWS_REGION}`);
    console.log(`   - Circuit breaker threshold: ${config.environment.CIRCUIT_BREAKER_FAILURE_THRESHOLD}`);
    console.log(`   - Retry max attempts: ${config.environment.RETRY_MAX_ATTEMPTS}`);
    console.log(`   - Health check interval: ${config.environment.HEALTH_CHECK_INTERVAL}ms`);
    console.log(`   - Analytics sync interval: ${config.environment.ANALYTICS_SYNC_INTERVAL}ms\n`);

    // Test 5: Health check
    console.log('Test 5: Health Check');
    console.log('====================');
    
    const healthResult = await performHealthCheck();
    console.log(`✅ Overall health: ${healthResult.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    console.log(`   - Environment check: ${healthResult.checks.environment ? '✅' : '❌'}`);
    console.log(`   - Database check: ${healthResult.checks.database ? '✅' : '❌'}`);
    console.log(`   - Logging check: ${healthResult.checks.logging ? '✅' : '❌'}`);
    
    if (!healthResult.healthy) {
      console.log('   - Health details:', JSON.stringify(healthResult.details, null, 2));
    }
    
    console.log(`   - Check timestamp: ${healthResult.timestamp.toISOString()}\n`);

    // Test 6: Logger context and structured logging
    console.log('Test 6: Advanced Logging Features');
    console.log('==================================');
    
    config.logger.setRequestId('test-request-123');
    config.logger.setUserId('test-user-456');
    
    config.logger.info('Testing request context', { 
      operation: 'test',
      data: { key: 'value' }
    });

    // Test API call logging
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
    const duration = Date.now() - startTime;
    
    (config.logger as any).logAPICall(
      '/api/test',
      'GET',
      duration,
      200,
      undefined,
      { testCall: true }
    );

    // Test operation logging
    (config.logger as any).logOperation(
      'test-operation',
      true,
      duration,
      { operationType: 'test' }
    );

    config.logger.clearContext();
    console.log('✅ Advanced logging features tested\n');

    console.log('🎉 All infrastructure tests completed successfully!');

  } catch (error) {
    console.error('❌ Infrastructure test failed:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test infrastructure...');
    await cleanupInfrastructure();
    console.log('✅ Cleanup completed');
  }
}

// ============================================================================
// Run Tests
// ============================================================================

if (require.main === module) {
  testInfrastructure()
    .then(() => {
      console.log('\n✅ Infrastructure test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Infrastructure test suite failed:', error);
      process.exit(1);
    });
}

export { testInfrastructure };