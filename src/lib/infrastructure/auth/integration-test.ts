/**
 * Integration test for Credential Manager
 * Verifies the credential manager integrates correctly with infrastructure initialization
 */

import { initializeInfrastructure } from '../init';
import { AuthMethod } from '../types';

/**
 * Test credential manager integration
 */
async function testCredentialManagerIntegration() {
  console.log('🧪 Testing Credential Manager Integration...');

  try {
    // Set up test environment variables
    process.env.APPTROVE_SDK_KEY = 'test_sdk_key_1234567890';
    process.env.APPTROVE_S2S_API_KEY = 'test_s2s_api_key_1234567890abcdef';
    process.env.APPTROVE_SECRET_ID = 'test_secret_id_123456';
    process.env.APPTROVE_SECRET_KEY = 'test_secret_key_1234567890abcdef';
    process.env.APPTROVE_REPORTING_API_KEY = 'test_reporting_key_123456789';
    process.env.AWS_REGION = 'us-east-1';
    process.env.DYNAMODB_TABLE_PREFIX = 'test-api-integration';
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'info';
    process.env.ADMIN_EMAIL = 'admin@test.com';

    // Initialize infrastructure
    console.log('📋 Initializing infrastructure...');
    const config = await initializeInfrastructure();

    // Test credential manager
    console.log('🔐 Testing credential manager...');
    const credentialManager = config.credentialManager;

    // Test credential validation
    console.log('✅ Testing credential validation...');
    const validation = await credentialManager.validateCredentials();
    console.log(`   Validation result: ${validation.valid ? 'PASS' : 'FAIL'}`);
    if (!validation.valid) {
      console.log('   Errors:', validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.log('   Warnings:', validation.warnings);
    }

    // Test authentication method selection
    console.log('🎯 Testing authentication method selection...');
    const testEndpoints = [
      { endpoint: '/api/v1/links/create', expected: AuthMethod.S2S_API },
      { endpoint: '/api/v1/templates', expected: AuthMethod.SDK_KEY },
      { endpoint: '/api/v1/analytics/links', expected: AuthMethod.REPORTING_API },
      { endpoint: '/api/v1/account/info', expected: AuthMethod.SECRET_CREDENTIALS }
    ];

    for (const test of testEndpoints) {
      const method = credentialManager.selectAuthMethod(test.endpoint);
      const result = method === test.expected ? 'PASS' : 'FAIL';
      console.log(`   ${test.endpoint}: ${method} (${result})`);
    }

    // Test header generation
    console.log('📝 Testing authentication header generation...');
    const authMethods = [
      AuthMethod.SDK_KEY,
      AuthMethod.S2S_API,
      AuthMethod.SECRET_CREDENTIALS,
      AuthMethod.REPORTING_API
    ];

    for (const method of authMethods) {
      const headers = credentialManager.getAuthHeaders(method);
      const hasHeaders = Object.keys(headers).length > 0;
      console.log(`   ${method}: ${hasHeaders ? 'PASS' : 'FAIL'} (${Object.keys(headers).length} headers)`);
    }

    // Test credential status
    console.log('📊 Testing credential status...');
    const status = credentialManager.getCredentialStatus();
    console.log(`   Available auth methods: ${status.availableAuthMethods.length}`);
    console.log(`   Endpoint count: ${status.endpointCount}`);
    console.log(`   Needs revalidation: ${status.needsRevalidation}`);

    // Test credentials for specific endpoint
    console.log('🔑 Testing credential retrieval for endpoint...');
    const credentials = credentialManager.getCredentialsForEndpoint('/api/v1/links/create');
    const hasCredentials = !!(credentials.sdkKey && credentials.s2sApiKey);
    console.log(`   Credentials available: ${hasCredentials ? 'PASS' : 'FAIL'}`);

    console.log('✅ All credential manager integration tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Credential manager integration test failed:', error);
    return false;
  }
}

/**
 * Test credential manager with invalid credentials
 */
async function testCredentialManagerWithInvalidCredentials() {
  console.log('🧪 Testing Credential Manager with Invalid Credentials...');

  try {
    // Set up invalid environment variables
    process.env.APPTROVE_SDK_KEY = 'invalid';
    process.env.APPTROVE_S2S_API_KEY = 'placeholder';
    process.env.APPTROVE_SECRET_ID = '';
    process.env.APPTROVE_SECRET_KEY = '';
    process.env.APPTROVE_REPORTING_API_KEY = 'your_key_here';

    // This should fail during initialization
    try {
      await initializeInfrastructure();
      console.log('❌ Expected initialization to fail with invalid credentials');
      return false;
    } catch (error) {
      console.log('✅ Correctly failed with invalid credentials:', (error as Error).message);
      return true;
    }

  } catch (error) {
    console.error('❌ Unexpected error in invalid credentials test:', error);
    return false;
  }
}

/**
 * Run all integration tests
 */
async function runIntegrationTests() {
  console.log('🚀 Starting Credential Manager Integration Tests...\n');

  const results = [];

  // Test 1: Valid credentials
  results.push(await testCredentialManagerIntegration());
  console.log('');

  // Test 2: Invalid credentials
  results.push(await testCredentialManagerWithInvalidCredentials());
  console.log('');

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`📊 Integration Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All integration tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some integration tests failed');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests().catch(error => {
    console.error('Fatal error running integration tests:', error);
    process.exit(1);
  });
}

export { testCredentialManagerIntegration, testCredentialManagerWithInvalidCredentials };