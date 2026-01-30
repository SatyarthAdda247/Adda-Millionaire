/**
 * Unit tests for Unified Credential Manager
 * Tests credential validation, authentication method selection, and error handling
 */

import { UnifiedCredentialManager, CredentialManagerFactory, CredentialUtils } from './credential-manager';
import { EnvironmentConfig, LogLevel, AuthMethod, CredentialType } from '../types';
import { LoggerFactory } from '../logging/logger';

// ============================================================================
// Test Configuration
// ============================================================================

const createTestConfig = (overrides: Partial<EnvironmentConfig> = {}): EnvironmentConfig => ({
  APPTROVE_SDK_KEY: 'test_sdk_key_1234567890',
  APPTROVE_S2S_API_KEY: 'test_s2s_api_key_1234567890abcdef',
  APPTROVE_SECRET_ID: 'test_secret_id_123456',
  APPTROVE_SECRET_KEY: 'test_secret_key_1234567890abcdef',
  APPTROVE_REPORTING_API_KEY: 'test_reporting_key_123456789',
  AWS_REGION: 'us-east-1',
  DYNAMODB_TABLE_PREFIX: 'test-api-integration',
  NODE_ENV: 'test',
  LOG_LEVEL: LogLevel.DEBUG,
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,
  CIRCUIT_BREAKER_RECOVERY_TIMEOUT: 60000,
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_BASE_DELAY: 1000,
  RETRY_MAX_DELAY: 10000,
  HEALTH_CHECK_INTERVAL: 300000,
  ANALYTICS_SYNC_INTERVAL: 900000,
  ADMIN_EMAIL: 'admin@test.com',
  ...overrides
});

const createTestLogger = () => LoggerFactory.createLogger(LogLevel.DEBUG);

// ============================================================================
// Credential Manager Tests
// ============================================================================

describe('UnifiedCredentialManager', () => {
  let credentialManager: UnifiedCredentialManager;
  let logger: any;

  beforeEach(() => {
    logger = createTestLogger();
    const config = createTestConfig();
    credentialManager = new UnifiedCredentialManager(config, logger);
  });

  describe('Credential Validation', () => {
    test('should validate valid credentials successfully', async () => {
      const result = await credentialManager.validateCredentials();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing credentials', async () => {
      const config = createTestConfig({
        APPTROVE_SDK_KEY: '',
        APPTROVE_S2S_API_KEY: ''
      });
      
      credentialManager = new UnifiedCredentialManager(config, logger);
      const result = await credentialManager.validateCredentials();
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('SDK Key'))).toBe(true);
    });

    test('should detect placeholder credentials', async () => {
      const config = createTestConfig({
        APPTROVE_SDK_KEY: 'your_key_here',
        APPTROVE_S2S_API_KEY: 'placeholder'
      });
      
      credentialManager = new UnifiedCredentialManager(config, logger);
      const result = await credentialManager.validateCredentials();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('placeholder'))).toBe(true);
    });

    test('should detect short credentials', async () => {
      const config = createTestConfig({
        APPTROVE_SDK_KEY: 'short',
        APPTROVE_S2S_API_KEY: 'too_short'
      });
      
      credentialManager = new UnifiedCredentialManager(config, logger);
      const result = await credentialManager.validateCredentials();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('too short'))).toBe(true);
    });

    test('should detect incomplete secret credentials', async () => {
      const config = createTestConfig({
        APPTROVE_SECRET_ID: 'test_secret_id_123456',
        APPTROVE_SECRET_KEY: '' // Missing secret key
      });
      
      credentialManager = new UnifiedCredentialManager(config, logger);
      const result = await credentialManager.validateCredentials();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('incomplete'))).toBe(true);
    });
  });

  describe('Authentication Method Selection', () => {
    test('should select correct auth method for link creation endpoint', () => {
      const method = credentialManager.selectAuthMethod('/api/v1/links/create');
      expect(method).toBe(AuthMethod.S2S_API);
    });

    test('should select correct auth method for template endpoint', () => {
      const method = credentialManager.selectAuthMethod('/api/v1/templates');
      expect(method).toBe(AuthMethod.SDK_KEY);
    });

    test('should select correct auth method for analytics endpoint', () => {
      const method = credentialManager.selectAuthMethod('/api/v1/analytics/links');
      expect(method).toBe(AuthMethod.REPORTING_API);
    });

    test('should select correct auth method for account endpoint', () => {
      const method = credentialManager.selectAuthMethod('/api/v1/account/info');
      expect(method).toBe(AuthMethod.SECRET_CREDENTIALS);
    });

    test('should fallback to default for unknown endpoint', () => {
      const method = credentialManager.selectAuthMethod('/api/v1/unknown/endpoint');
      expect(method).toBe(AuthMethod.S2S_API);
    });

    test('should use fallback method when primary is unavailable', () => {
      // Create config without SDK key
      const config = createTestConfig({
        APPTROVE_SDK_KEY: ''
      });
      
      credentialManager = new UnifiedCredentialManager(config, logger);
      const method = credentialManager.selectAuthMethod('/api/v1/templates');
      
      // Should fallback to S2S_API since SDK_KEY is not available
      expect(method).toBe(AuthMethod.S2S_API);
    });
  });

  describe('Authentication Headers', () => {
    test('should generate correct headers for SDK key auth', () => {
      const headers = credentialManager.getAuthHeaders(AuthMethod.SDK_KEY);
      
      expect(headers['X-SDK-Key']).toBe('test_sdk_key_1234567890');
    });

    test('should generate correct headers for S2S API auth', () => {
      const headers = credentialManager.getAuthHeaders(AuthMethod.S2S_API);
      
      expect(headers['X-API-Key']).toBe('test_s2s_api_key_1234567890abcdef');
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should generate correct headers for secret credentials auth', () => {
      const headers = credentialManager.getAuthHeaders(AuthMethod.SECRET_CREDENTIALS);
      
      expect(headers['Authorization']).toMatch(/^Basic /);
      
      // Decode and verify the basic auth
      const authValue = headers['Authorization'].replace('Basic ', '');
      const decoded = Buffer.from(authValue, 'base64').toString();
      expect(decoded).toBe('test_secret_id_123456:test_secret_key_1234567890abcdef');
    });

    test('should generate correct headers for reporting API auth', () => {
      const headers = credentialManager.getAuthHeaders(AuthMethod.REPORTING_API);
      
      expect(headers['X-Reporting-Key']).toBe('test_reporting_key_123456789');
      expect(headers['Accept']).toBe('application/json');
    });
  });

  describe('Credential Status', () => {
    test('should provide credential status summary', () => {
      const status = credentialManager.getCredentialStatus();
      
      expect(status).toHaveProperty('lastValidation');
      expect(status).toHaveProperty('needsRevalidation');
      expect(status).toHaveProperty('availableAuthMethods');
      expect(status).toHaveProperty('endpointCount');
      
      expect(Array.isArray(status.availableAuthMethods)).toBe(true);
      expect(status.endpointCount).toBeGreaterThan(0);
    });

    test('should indicate revalidation needed for new instance', () => {
      const status = credentialManager.getCredentialStatus();
      expect(status.needsRevalidation).toBe(true);
    });
  });

  describe('Credential Rotation', () => {
    test('should simulate credential rotation', async () => {
      await expect(
        credentialManager.rotateCredentials(CredentialType.SDK_KEY)
      ).resolves.not.toThrow();
    });

    test('should handle rotation errors gracefully', async () => {
      // Mock a rotation failure by overriding the simulate method
      const originalSimulate = (credentialManager as any).simulateCredentialRotation;
      (credentialManager as any).simulateCredentialRotation = jest.fn().mockRejectedValue(
        new Error('Rotation failed')
      );

      await expect(
        credentialManager.rotateCredentials(CredentialType.SDK_KEY)
      ).rejects.toThrow('Rotation failed');

      // Restore original method
      (credentialManager as any).simulateCredentialRotation = originalSimulate;
    });
  });
});

// ============================================================================
// Credential Manager Factory Tests
// ============================================================================

describe('CredentialManagerFactory', () => {
  test('should create credential manager instance', () => {
    const config = createTestConfig();
    const logger = createTestLogger();
    
    const manager = CredentialManagerFactory.create(config, logger);
    expect(manager).toBeInstanceOf(UnifiedCredentialManager);
  });

  test('should return singleton instance', () => {
    const config = createTestConfig();
    const logger = createTestLogger();
    
    const manager1 = CredentialManagerFactory.getInstance(config, logger);
    const manager2 = CredentialManagerFactory.getInstance(config, logger);
    
    expect(manager1).toBe(manager2);
  });

  test('should reset singleton instance', () => {
    const config = createTestConfig();
    const logger = createTestLogger();
    
    const manager1 = CredentialManagerFactory.getInstance(config, logger);
    CredentialManagerFactory.reset();
    const manager2 = CredentialManagerFactory.getInstance(config, logger);
    
    expect(manager1).not.toBe(manager2);
  });
});

// ============================================================================
// Credential Utilities Tests
// ============================================================================

describe('CredentialUtils', () => {
  test('should mask credentials for logging', () => {
    const credential = 'test_credential_1234567890';
    const masked = CredentialUtils.maskCredential(credential);
    
    expect(masked).toBe('test****7890');
    expect(masked).not.toContain('credential_123456');
  });

  test('should handle short credentials', () => {
    const shortCredential = 'short';
    const masked = CredentialUtils.maskCredential(shortCredential);
    
    expect(masked).toBe('[REDACTED]');
  });

  test('should validate credential format', () => {
    const validCredential = 'test_sdk_key_1234567890';
    const invalidCredential = 'short';
    
    expect(CredentialUtils.validateCredentialFormat(validCredential, CredentialType.SDK_KEY)).toBe(true);
    expect(CredentialUtils.validateCredentialFormat(invalidCredential, CredentialType.SDK_KEY)).toBe(false);
  });

  test('should get endpoint auth requirements', () => {
    const requirements = CredentialUtils.getEndpointAuthRequirements('/api/v1/links/create');
    
    expect(requirements).not.toBeNull();
    expect(requirements?.primaryAuth).toBe(AuthMethod.S2S_API);
    expect(requirements?.fallbackAuth).toContain(AuthMethod.SECRET_CREDENTIALS);
  });

  test('should return null for unknown endpoint', () => {
    const requirements = CredentialUtils.getEndpointAuthRequirements('/api/v1/unknown');
    expect(requirements).toBeNull();
  });

  test('should get supported endpoints list', () => {
    const endpoints = CredentialUtils.getSupportedEndpoints();
    
    expect(Array.isArray(endpoints)).toBe(true);
    expect(endpoints.length).toBeGreaterThan(0);
    expect(endpoints).toContain('/api/v1/links/create');
    expect(endpoints).toContain('/api/v1/templates');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Credential Manager Integration', () => {
  test('should integrate with infrastructure initialization', async () => {
    const config = createTestConfig();
    const logger = createTestLogger();
    
    const credentialManager = CredentialManagerFactory.create(config, logger);
    
    // Validate credentials
    const validation = await credentialManager.validateCredentials();
    expect(validation.valid).toBe(true);
    
    // Test endpoint selection
    const method = credentialManager.selectAuthMethod('/api/v1/links/create');
    expect(method).toBe(AuthMethod.S2S_API);
    
    // Test header generation
    const headers = credentialManager.getAuthHeaders(method);
    expect(headers['X-API-Key']).toBeTruthy();
  });

  test('should handle complete credential failure gracefully', async () => {
    const config = createTestConfig({
      APPTROVE_SDK_KEY: '',
      APPTROVE_S2S_API_KEY: '',
      APPTROVE_SECRET_ID: '',
      APPTROVE_SECRET_KEY: '',
      APPTROVE_REPORTING_API_KEY: ''
    });
    
    const logger = createTestLogger();
    const credentialManager = new UnifiedCredentialManager(config, logger);
    
    const validation = await credentialManager.validateCredentials();
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    
    // Should still provide fallback behavior
    const method = credentialManager.selectAuthMethod('/api/v1/links/create');
    expect(method).toBe(AuthMethod.S2S_API); // Returns primary even if unavailable
  });
});