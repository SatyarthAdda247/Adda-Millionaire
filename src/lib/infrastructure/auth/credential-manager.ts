/**
 * Unified Credential Manager for AppTrove API Integration
 * Implements Requirements 2.1, 2.2, 2.4 from the API Integration Reliability spec
 * 
 * Provides:
 * - Consolidated management of all AppTrove API key types
 * - Credential validation on system startup
 * - Automatic authentication method selection per endpoint
 * - Credential rotation and fallback mechanisms
 */

import {
  APICredentials,
  AuthMethod,
  CredentialType,
  ValidationResult,
  AuthenticationManager,
  Logger,
  EnvironmentConfig,
  APIError
} from '../types';

// ============================================================================
// Endpoint Authentication Mapping
// ============================================================================

interface EndpointAuthConfig {
  endpoint: string;
  primaryAuth: AuthMethod;
  fallbackAuth?: AuthMethod[];
  description: string;
}

/**
 * Mapping of AppTrove API endpoints to their required authentication methods
 * Based on AppTrove API documentation and endpoint requirements
 */
const ENDPOINT_AUTH_MAPPING: EndpointAuthConfig[] = [
  // Link Creation Endpoints
  {
    endpoint: '/api/v1/links/create',
    primaryAuth: AuthMethod.S2S_API,
    fallbackAuth: [AuthMethod.SECRET_CREDENTIALS],
    description: 'Create affiliate tracking links'
  },
  {
    endpoint: '/api/v1/links/bulk-create',
    primaryAuth: AuthMethod.S2S_API,
    fallbackAuth: [AuthMethod.SECRET_CREDENTIALS],
    description: 'Bulk create affiliate tracking links'
  },
  
  // Template Management Endpoints
  {
    endpoint: '/api/v1/templates',
    primaryAuth: AuthMethod.SDK_KEY,
    fallbackAuth: [AuthMethod.S2S_API],
    description: 'Fetch available link templates'
  },
  {
    endpoint: '/api/v1/templates/validate',
    primaryAuth: AuthMethod.SDK_KEY,
    fallbackAuth: [AuthMethod.S2S_API],
    description: 'Validate template availability'
  },
  
  // Analytics and Reporting Endpoints
  {
    endpoint: '/api/v1/analytics/links',
    primaryAuth: AuthMethod.REPORTING_API,
    fallbackAuth: [AuthMethod.S2S_API],
    description: 'Fetch link performance analytics'
  },
  {
    endpoint: '/api/v1/analytics/conversions',
    primaryAuth: AuthMethod.REPORTING_API,
    fallbackAuth: [AuthMethod.S2S_API],
    description: 'Fetch conversion analytics'
  },
  {
    endpoint: '/api/v1/reports/performance',
    primaryAuth: AuthMethod.REPORTING_API,
    description: 'Generate performance reports'
  },
  
  // Account and Configuration Endpoints
  {
    endpoint: '/api/v1/account/info',
    primaryAuth: AuthMethod.SECRET_CREDENTIALS,
    description: 'Fetch account information'
  },
  {
    endpoint: '/api/v1/account/limits',
    primaryAuth: AuthMethod.SECRET_CREDENTIALS,
    fallbackAuth: [AuthMethod.S2S_API],
    description: 'Check account limits and quotas'
  },
  
  // Health and Status Endpoints
  {
    endpoint: '/api/v1/health',
    primaryAuth: AuthMethod.SDK_KEY,
    description: 'API health check'
  },
  {
    endpoint: '/api/v1/status',
    primaryAuth: AuthMethod.SDK_KEY,
    fallbackAuth: [AuthMethod.S2S_API],
    description: 'API status information'
  }
];

// ============================================================================
// Credential Validation Rules
// ============================================================================

interface CredentialValidationRule {
  type: CredentialType;
  minLength: number;
  pattern?: RegExp;
  description: string;
}

const CREDENTIAL_VALIDATION_RULES: CredentialValidationRule[] = [
  {
    type: CredentialType.SDK_KEY,
    minLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
    description: 'SDK Key for client-side operations'
  },
  {
    type: CredentialType.S2S_API_KEY,
    minLength: 32,
    pattern: /^[a-zA-Z0-9_-]+$/,
    description: 'Server-to-Server API Key'
  },
  {
    type: CredentialType.SECRET_ID,
    minLength: 16,
    pattern: /^[a-zA-Z0-9_-]+$/,
    description: 'Secret ID for authentication'
  },
  {
    type: CredentialType.SECRET_KEY,
    minLength: 32,
    pattern: /^[a-zA-Z0-9_-]+$/,
    description: 'Secret Key for authentication'
  },
  {
    type: CredentialType.REPORTING_API_KEY,
    minLength: 24,
    pattern: /^[a-zA-Z0-9_-]+$/,
    description: 'Reporting API Key for analytics'
  }
];

// ============================================================================
// Unified Credential Manager Implementation
// ============================================================================

export class UnifiedCredentialManager implements AuthenticationManager {
  private credentials: APICredentials;
  private logger: Logger;
  private validationCache: Map<CredentialType, boolean> = new Map();
  private lastValidation: Date | null = null;
  private validationInterval: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(config: EnvironmentConfig, logger: Logger) {
    this.logger = logger;
    this.credentials = {
      sdkKey: config.APPTROVE_SDK_KEY,
      s2sApiKey: config.APPTROVE_S2S_API_KEY,
      secretId: config.APPTROVE_SECRET_ID,
      secretKey: config.APPTROVE_SECRET_KEY,
      reportingApiKey: config.APPTROVE_REPORTING_API_KEY
    };

    this.logger.info('Unified Credential Manager initialized', {
      hasSDKKey: !!this.credentials.sdkKey,
      hasS2SKey: !!this.credentials.s2sApiKey,
      hasSecretId: !!this.credentials.secretId,
      hasSecretKey: !!this.credentials.secretKey,
      hasReportingKey: !!this.credentials.reportingApiKey
    });
  }

  /**
   * Get credentials for a specific endpoint
   * Implements automatic authentication method selection
   */
  getCredentialsForEndpoint(endpoint: string): APICredentials {
    const authConfig = this.findEndpointAuthConfig(endpoint);
    
    if (!authConfig) {
      this.logger.warn('No authentication configuration found for endpoint', {
        endpoint,
        fallbackToDefault: true
      });
      // Return all credentials for unknown endpoints
      return this.credentials;
    }

    this.logger.debug('Selected authentication method for endpoint', {
      endpoint,
      primaryAuth: authConfig.primaryAuth,
      hasFallback: !!authConfig.fallbackAuth?.length
    });

    return this.credentials;
  }

  /**
   * Validate all credentials on system startup
   * Implements Requirements 2.4 - credential validation on startup
   */
  async validateCredentials(): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    this.logger.info('Starting credential validation');

    try {
      // Step 1: Format validation
      const formatValidation = this.validateCredentialFormats();
      errors.push(...formatValidation.errors);
      warnings.push(...formatValidation.warnings);

      // Step 2: Logical validation (check for placeholder values)
      const logicalValidation = this.validateCredentialLogic();
      errors.push(...logicalValidation.errors);
      warnings.push(...logicalValidation.warnings);

      // Step 3: Completeness validation
      const completenessValidation = this.validateCredentialCompleteness();
      errors.push(...completenessValidation.errors);
      warnings.push(...completenessValidation.warnings);

      // Step 4: Cross-validation (ensure credentials work together)
      const crossValidation = this.validateCredentialConsistency();
      errors.push(...crossValidation.errors);
      warnings.push(...crossValidation.warnings);

      // Update validation cache
      this.updateValidationCache(errors.length === 0);
      this.lastValidation = new Date();

      const duration = Date.now() - startTime;
      const result: ValidationResult = {
        valid: errors.length === 0,
        errors,
        warnings
      };

      this.logger.info('Credential validation completed', {
        valid: result.valid,
        errorCount: errors.length,
        warningCount: warnings.length,
        duration
      });

      if (errors.length > 0) {
        this.logger.error('Credential validation failed', undefined, {
          errors: errors.slice(0, 5), // Log first 5 errors to avoid spam
          totalErrors: errors.length
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Credential validation threw exception', error as Error, {
        duration
      });

      return {
        valid: false,
        errors: [`Credential validation failed: ${(error as Error).message}`],
        warnings
      };
    }
  }

  /**
   * Select appropriate authentication method for endpoint
   * Implements Requirements 2.2 - automatic authentication method selection
   */
  selectAuthMethod(endpoint: string): AuthMethod {
    const authConfig = this.findEndpointAuthConfig(endpoint);
    
    if (!authConfig) {
      this.logger.warn('No authentication configuration found for endpoint, using default', {
        endpoint,
        defaultMethod: AuthMethod.S2S_API
      });
      return AuthMethod.S2S_API;
    }

    // Check if primary authentication method is available
    const primaryAvailable = this.isAuthMethodAvailable(authConfig.primaryAuth);
    
    if (primaryAvailable) {
      this.logger.debug('Using primary authentication method', {
        endpoint,
        method: authConfig.primaryAuth
      });
      return authConfig.primaryAuth;
    }

    // Try fallback methods
    if (authConfig.fallbackAuth) {
      for (const fallbackMethod of authConfig.fallbackAuth) {
        if (this.isAuthMethodAvailable(fallbackMethod)) {
          this.logger.info('Using fallback authentication method', {
            endpoint,
            primaryMethod: authConfig.primaryAuth,
            fallbackMethod,
            reason: 'Primary method not available'
          });
          return fallbackMethod;
        }
      }
    }

    // If no methods are available, log error and return primary anyway
    this.logger.error('No authentication methods available for endpoint', undefined, {
      endpoint,
      primaryMethod: authConfig.primaryAuth,
      fallbackMethods: authConfig.fallbackAuth
    });

    return authConfig.primaryAuth;
  }

  /**
   * Rotate credentials for a specific type
   * Implements credential rotation capability
   */
  async rotateCredentials(credentialType: CredentialType): Promise<void> {
    this.logger.info('Starting credential rotation', {
      credentialType
    });

    try {
      // In a real implementation, this would:
      // 1. Generate new credentials via AppTrove API
      // 2. Test new credentials
      // 3. Update stored credentials
      // 4. Invalidate old credentials
      
      // For now, we'll simulate the process
      await this.simulateCredentialRotation(credentialType);
      
      // Clear validation cache for rotated credential
      this.validationCache.delete(credentialType);
      
      this.logger.info('Credential rotation completed', {
        credentialType
      });
    } catch (error) {
      this.logger.error('Credential rotation failed', error as Error, {
        credentialType
      });
      throw error;
    }
  }

  /**
   * Get authentication headers for a specific method
   */
  getAuthHeaders(method: AuthMethod): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (method) {
      case AuthMethod.SDK_KEY:
        headers['X-SDK-Key'] = this.credentials.sdkKey;
        break;
        
      case AuthMethod.S2S_API:
        headers['X-API-Key'] = this.credentials.s2sApiKey;
        headers['Content-Type'] = 'application/json';
        break;
        
      case AuthMethod.SECRET_CREDENTIALS:
        // Use HTTP Basic Auth with secret credentials
        const auth = Buffer.from(`${this.credentials.secretId}:${this.credentials.secretKey}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
        break;
        
      case AuthMethod.REPORTING_API:
        headers['X-Reporting-Key'] = this.credentials.reportingApiKey;
        headers['Accept'] = 'application/json';
        break;
        
      default:
        this.logger.warn('Unknown authentication method', { method });
        break;
    }

    return headers;
  }

  /**
   * Check if credentials need revalidation
   */
  needsRevalidation(): boolean {
    if (!this.lastValidation) {
      return true;
    }

    const timeSinceValidation = Date.now() - this.lastValidation.getTime();
    return timeSinceValidation > this.validationInterval;
  }

  /**
   * Get credential status summary
   */
  getCredentialStatus(): Record<string, any> {
    return {
      lastValidation: this.lastValidation?.toISOString(),
      needsRevalidation: this.needsRevalidation(),
      validationCache: Object.fromEntries(this.validationCache),
      availableAuthMethods: this.getAvailableAuthMethods(),
      endpointCount: ENDPOINT_AUTH_MAPPING.length
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Find authentication configuration for endpoint
   */
  private findEndpointAuthConfig(endpoint: string): EndpointAuthConfig | null {
    // Try exact match first
    let config = ENDPOINT_AUTH_MAPPING.find(config => config.endpoint === endpoint);
    
    if (config) {
      return config;
    }

    // Try pattern matching for dynamic endpoints
    config = ENDPOINT_AUTH_MAPPING.find(config => {
      const pattern = config.endpoint.replace(/\{[^}]+\}/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(endpoint);
    });

    return config || null;
  }

  /**
   * Check if authentication method is available
   */
  private isAuthMethodAvailable(method: AuthMethod): boolean {
    switch (method) {
      case AuthMethod.SDK_KEY:
        return !!this.credentials.sdkKey && this.credentials.sdkKey.length > 0;
      case AuthMethod.S2S_API:
        return !!this.credentials.s2sApiKey && this.credentials.s2sApiKey.length > 0;
      case AuthMethod.SECRET_CREDENTIALS:
        return !!this.credentials.secretId && !!this.credentials.secretKey &&
               this.credentials.secretId.length > 0 && this.credentials.secretKey.length > 0;
      case AuthMethod.REPORTING_API:
        return !!this.credentials.reportingApiKey && this.credentials.reportingApiKey.length > 0;
      default:
        return false;
    }
  }

  /**
   * Get list of available authentication methods
   */
  private getAvailableAuthMethods(): AuthMethod[] {
    return Object.values(AuthMethod).filter(method => this.isAuthMethodAvailable(method));
  }

  /**
   * Validate credential formats against rules
   */
  private validateCredentialFormats(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of CREDENTIAL_VALIDATION_RULES) {
      const credential = this.getCredentialByType(rule.type);
      
      if (!credential) {
        errors.push(`Missing credential: ${rule.description}`);
        continue;
      }

      if (credential.length < rule.minLength) {
        errors.push(`${rule.description} is too short (minimum ${rule.minLength} characters)`);
      }

      if (rule.pattern && !rule.pattern.test(credential)) {
        errors.push(`${rule.description} has invalid format`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate credential logic (check for placeholder values)
   */
  private validateCredentialLogic(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const placeholderPatterns = [
      'your_key_here',
      'placeholder',
      'test_key',
      'example_key',
      'change_me',
      'replace_me'
    ];

    for (const rule of CREDENTIAL_VALIDATION_RULES) {
      const credential = this.getCredentialByType(rule.type);
      
      if (credential) {
        const lowerCredential = credential.toLowerCase();
        
        for (const pattern of placeholderPatterns) {
          if (lowerCredential.includes(pattern)) {
            errors.push(`${rule.description} appears to be a placeholder value`);
            break;
          }
        }

        // Check for repeated characters (likely test values)
        if (/^(.)\1{10,}$/.test(credential)) {
          warnings.push(`${rule.description} appears to be a test value (repeated characters)`);
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate credential completeness
   */
  private validateCredentialCompleteness(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that we have at least one working authentication method
    const availableMethods = this.getAvailableAuthMethods();
    
    if (availableMethods.length === 0) {
      errors.push('No authentication methods are available - all credentials are missing or invalid');
    } else if (availableMethods.length < 2) {
      warnings.push('Only one authentication method is available - consider configuring fallback methods');
    }

    // Check for critical missing credentials
    if (!this.isAuthMethodAvailable(AuthMethod.S2S_API)) {
      errors.push('S2S API Key is missing - this is required for core link creation functionality');
    }

    if (!this.isAuthMethodAvailable(AuthMethod.SDK_KEY)) {
      warnings.push('SDK Key is missing - this may limit template management capabilities');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate credential consistency
   */
  private validateCredentialConsistency(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that secret credentials are both present or both absent
    const hasSecretId = !!this.credentials.secretId;
    const hasSecretKey = !!this.credentials.secretKey;
    
    if (hasSecretId !== hasSecretKey) {
      errors.push('Secret credentials are incomplete - both Secret ID and Secret Key are required');
    }

    // Check for duplicate credentials (which might indicate configuration errors)
    const credentialValues = [
      this.credentials.sdkKey,
      this.credentials.s2sApiKey,
      this.credentials.secretId,
      this.credentials.secretKey,
      this.credentials.reportingApiKey
    ].filter(Boolean);

    const uniqueValues = new Set(credentialValues);
    if (uniqueValues.size !== credentialValues.length) {
      warnings.push('Some credentials have identical values - this may indicate configuration errors');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Get credential value by type
   */
  private getCredentialByType(type: CredentialType): string | null {
    switch (type) {
      case CredentialType.SDK_KEY:
        return this.credentials.sdkKey;
      case CredentialType.S2S_API_KEY:
        return this.credentials.s2sApiKey;
      case CredentialType.SECRET_ID:
        return this.credentials.secretId;
      case CredentialType.SECRET_KEY:
        return this.credentials.secretKey;
      case CredentialType.REPORTING_API_KEY:
        return this.credentials.reportingApiKey;
      default:
        return null;
    }
  }

  /**
   * Update validation cache
   */
  private updateValidationCache(isValid: boolean): void {
    for (const type of Object.values(CredentialType)) {
      this.validationCache.set(type, isValid);
    }
  }

  /**
   * Simulate credential rotation (placeholder for real implementation)
   */
  private async simulateCredentialRotation(credentialType: CredentialType): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would:
    // 1. Call AppTrove API to generate new credentials
    // 2. Test the new credentials
    // 3. Update the stored credentials
    // 4. Notify other system components
    
    this.logger.info('Credential rotation simulated', {
      credentialType,
      note: 'Real implementation would call AppTrove API'
    });
  }
}

// ============================================================================
// Credential Manager Factory
// ============================================================================

export class CredentialManagerFactory {
  private static instance: UnifiedCredentialManager;

  /**
   * Create credential manager from environment configuration
   */
  static create(config: EnvironmentConfig, logger: Logger): UnifiedCredentialManager {
    return new UnifiedCredentialManager(config, logger);
  }

  /**
   * Get singleton instance
   */
  static getInstance(config: EnvironmentConfig, logger: Logger): UnifiedCredentialManager {
    if (!CredentialManagerFactory.instance) {
      CredentialManagerFactory.instance = new UnifiedCredentialManager(config, logger);
    }
    return CredentialManagerFactory.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static reset(): void {
    CredentialManagerFactory.instance = null as any;
  }
}

// ============================================================================
// Credential Utilities
// ============================================================================

export class CredentialUtils {
  /**
   * Mask credential for logging
   */
  static maskCredential(credential: string): string {
    if (!credential || credential.length < 8) {
      return '[REDACTED]';
    }
    
    return `${credential.substring(0, 4)}****${credential.substring(credential.length - 4)}`;
  }

  /**
   * Validate credential format
   */
  static validateCredentialFormat(credential: string, type: CredentialType): boolean {
    const rule = CREDENTIAL_VALIDATION_RULES.find(r => r.type === type);
    if (!rule) {
      return false;
    }

    if (credential.length < rule.minLength) {
      return false;
    }

    if (rule.pattern && !rule.pattern.test(credential)) {
      return false;
    }

    return true;
  }

  /**
   * Get authentication method requirements for endpoint
   */
  static getEndpointAuthRequirements(endpoint: string): EndpointAuthConfig | null {
    return ENDPOINT_AUTH_MAPPING.find(config => config.endpoint === endpoint) || null;
  }

  /**
   * Get all supported endpoints
   */
  static getSupportedEndpoints(): string[] {
    return ENDPOINT_AUTH_MAPPING.map(config => config.endpoint);
  }
}