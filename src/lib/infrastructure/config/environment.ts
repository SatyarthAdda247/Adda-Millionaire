/**
 * Environment variable management and validation
 * Implements comprehensive configuration validation as specified in requirements 2.1, 2.4, 4.1
 */

import { EnvironmentConfig, ValidationResult, ConfigValidator, LogLevel } from '../types';

// ============================================================================
// Environment Variable Definitions
// ============================================================================

interface EnvironmentVariable {
  key: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  description: string;
  sensitive?: boolean;
}

const ENVIRONMENT_VARIABLES: EnvironmentVariable[] = [
  // AppTrove API Configuration
  {
    key: 'APPTROVE_SDK_KEY',
    required: true,
    description: 'AppTrove SDK Key for client-side operations',
    sensitive: true
  },
  {
    key: 'APPTROVE_S2S_API_KEY',
    required: true,
    description: 'AppTrove Server-to-Server API Key',
    sensitive: true
  },
  {
    key: 'APPTROVE_SECRET_ID',
    required: true,
    description: 'AppTrove Secret ID for authentication',
    sensitive: true
  },
  {
    key: 'APPTROVE_SECRET_KEY',
    required: true,
    description: 'AppTrove Secret Key for authentication',
    sensitive: true
  },
  {
    key: 'APPTROVE_REPORTING_API_KEY',
    required: true,
    description: 'AppTrove Reporting API Key for analytics',
    sensitive: true
  },

  // Database Configuration
  {
    key: 'AWS_REGION',
    required: true,
    defaultValue: 'us-east-1',
    description: 'AWS region for DynamoDB',
    validator: (value) => /^[a-z0-9-]+$/.test(value)
  },
  {
    key: 'DYNAMODB_TABLE_PREFIX',
    required: true,
    defaultValue: 'api-integration-reliability',
    description: 'Prefix for DynamoDB table names',
    validator: (value) => /^[a-zA-Z0-9-_]+$/.test(value)
  },

  // System Configuration
  {
    key: 'NODE_ENV',
    required: true,
    defaultValue: 'development',
    description: 'Node.js environment',
    validator: (value) => ['development', 'production', 'test'].includes(value)
  },
  {
    key: 'LOG_LEVEL',
    required: false,
    defaultValue: 'info',
    description: 'Logging level',
    validator: (value) => Object.values(LogLevel).includes(value as LogLevel)
  },

  // Circuit Breaker Configuration
  {
    key: 'CIRCUIT_BREAKER_FAILURE_THRESHOLD',
    required: false,
    defaultValue: '5',
    description: 'Number of failures before opening circuit breaker',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0
  },
  {
    key: 'CIRCUIT_BREAKER_RECOVERY_TIMEOUT',
    required: false,
    defaultValue: '60000',
    description: 'Circuit breaker recovery timeout in milliseconds',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0
  },

  // Retry Configuration
  {
    key: 'RETRY_MAX_ATTEMPTS',
    required: false,
    defaultValue: '3',
    description: 'Maximum retry attempts for failed API calls',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0
  },
  {
    key: 'RETRY_BASE_DELAY',
    required: false,
    defaultValue: '1000',
    description: 'Base delay for retry attempts in milliseconds',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0
  },
  {
    key: 'RETRY_MAX_DELAY',
    required: false,
    defaultValue: '10000',
    description: 'Maximum delay for retry attempts in milliseconds',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0
  },

  // Monitoring Configuration
  {
    key: 'HEALTH_CHECK_INTERVAL',
    required: false,
    defaultValue: '300000',
    description: 'Health check interval in milliseconds (5 minutes)',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0
  },
  {
    key: 'ANALYTICS_SYNC_INTERVAL',
    required: false,
    defaultValue: '900000',
    description: 'Analytics sync interval in milliseconds (15 minutes)',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0
  },

  // Notification Configuration
  {
    key: 'ADMIN_EMAIL',
    required: true,
    description: 'Administrator email for notifications',
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },
  {
    key: 'NOTIFICATION_SERVICE_URL',
    required: false,
    description: 'URL for external notification service',
    validator: (value) => /^https?:\/\/.+/.test(value)
  }
];

// ============================================================================
// Environment Configuration Loader
// ============================================================================

export class EnvironmentConfigLoader {
  private static instance: EnvironmentConfigLoader;
  private config: EnvironmentConfig | null = null;
  private validationResult: ValidationResult | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): EnvironmentConfigLoader {
    if (!EnvironmentConfigLoader.instance) {
      EnvironmentConfigLoader.instance = new EnvironmentConfigLoader();
    }
    return EnvironmentConfigLoader.instance;
  }

  /**
   * Load and validate environment configuration
   */
  loadConfig(): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    const config: Partial<EnvironmentConfig> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // Process each environment variable
    for (const envVar of ENVIRONMENT_VARIABLES) {
      const value = process.env[envVar.key] || envVar.defaultValue;

      if (!value && envVar.required) {
        errors.push(`Missing required environment variable: ${envVar.key} - ${envVar.description}`);
        continue;
      }

      if (value) {
        // Validate the value if validator is provided
        if (envVar.validator && !envVar.validator(value)) {
          errors.push(`Invalid value for ${envVar.key}: ${envVar.sensitive ? '[REDACTED]' : value}`);
          continue;
        }

        // Type conversion based on the key
        if (envVar.key.includes('THRESHOLD') || envVar.key.includes('TIMEOUT') || 
            envVar.key.includes('ATTEMPTS') || envVar.key.includes('DELAY') || 
            envVar.key.includes('INTERVAL')) {
          (config as any)[this.toCamelCase(envVar.key)] = parseInt(value);
        } else if (envVar.key === 'LOG_LEVEL') {
          (config as any)[this.toCamelCase(envVar.key)] = value as LogLevel;
        } else if (envVar.key === 'NODE_ENV') {
          (config as any)[this.toCamelCase(envVar.key)] = value as 'development' | 'production' | 'test';
        } else {
          (config as any)[this.toCamelCase(envVar.key)] = value;
        }
      } else if (envVar.defaultValue) {
        warnings.push(`Using default value for ${envVar.key}`);
      }
    }

    // Store validation result
    this.validationResult = {
      valid: errors.length === 0,
      errors,
      warnings
    };

    if (errors.length > 0) {
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }

    this.config = config as EnvironmentConfig;
    return this.config;
  }

  /**
   * Get validation result from last load attempt
   */
  getValidationResult(): ValidationResult | null {
    return this.validationResult;
  }

  /**
   * Convert environment variable key to camelCase
   */
  private toCamelCase(str: string): string {
    return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Get configuration summary (without sensitive values)
   */
  getConfigSummary(): Record<string, any> {
    if (!this.config) {
      return {};
    }

    const summary: Record<string, any> = {};
    
    for (const envVar of ENVIRONMENT_VARIABLES) {
      const key = this.toCamelCase(envVar.key);
      const value = (this.config as any)[key];
      
      if (value !== undefined) {
        summary[key] = envVar.sensitive ? '[REDACTED]' : value;
      }
    }

    return summary;
  }

  /**
   * Validate specific credential
   */
  validateCredential(credentialType: string): boolean {
    if (!this.config) {
      return false;
    }

    const key = this.toCamelCase(credentialType);
    const value = (this.config as any)[key];
    
    return typeof value === 'string' && value.length > 0;
  }

  /**
   * Reset configuration (for testing)
   */
  reset(): void {
    this.config = null;
    this.validationResult = null;
  }
}

// ============================================================================
// Configuration Validator Implementation
// ============================================================================

export class EnvironmentConfigValidator implements ConfigValidator {
  private loader: EnvironmentConfigLoader;

  constructor() {
    this.loader = EnvironmentConfigLoader.getInstance();
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment(): ValidationResult {
    try {
      this.loader.loadConfig();
      return this.loader.getValidationResult() || { valid: true, errors: [], warnings: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        warnings: []
      };
    }
  }

  /**
   * Get list of required environment variables
   */
  getRequiredVariables(): string[] {
    return ENVIRONMENT_VARIABLES
      .filter(envVar => envVar.required)
      .map(envVar => envVar.key);
  }

  /**
   * Get list of optional environment variables
   */
  getOptionalVariables(): string[] {
    return ENVIRONMENT_VARIABLES
      .filter(envVar => !envVar.required)
      .map(envVar => envVar.key);
  }

  /**
   * Validate credentials by attempting to use them
   */
  async validateCredentials(): Promise<ValidationResult> {
    const config = this.loader.loadConfig();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check AppTrove credentials format
    const credentials = [
      { key: 'APPTROVE_SDK_KEY', value: config.APPTROVE_SDK_KEY },
      { key: 'APPTROVE_S2S_API_KEY', value: config.APPTROVE_S2S_API_KEY },
      { key: 'APPTROVE_SECRET_ID', value: config.APPTROVE_SECRET_ID },
      { key: 'APPTROVE_SECRET_KEY', value: config.APPTROVE_SECRET_KEY },
      { key: 'APPTROVE_REPORTING_API_KEY', value: config.APPTROVE_REPORTING_API_KEY }
    ];

    for (const credential of credentials) {
      if (!credential.value || credential.value.length < 10) {
        errors.push(`${credential.key} appears to be invalid (too short or empty)`);
      }
    }

    // Validate email format
    if (config.ADMIN_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.ADMIN_EMAIL)) {
      errors.push('ADMIN_EMAIL is not a valid email address');
    }

    // Validate numeric configurations
    const numericConfigs = [
      { key: 'CIRCUIT_BREAKER_FAILURE_THRESHOLD', value: config.CIRCUIT_BREAKER_FAILURE_THRESHOLD, min: 1, max: 100 },
      { key: 'CIRCUIT_BREAKER_RECOVERY_TIMEOUT', value: config.CIRCUIT_BREAKER_RECOVERY_TIMEOUT, min: 1000, max: 600000 },
      { key: 'RETRY_MAX_ATTEMPTS', value: config.RETRY_MAX_ATTEMPTS, min: 1, max: 10 },
      { key: 'RETRY_BASE_DELAY', value: config.RETRY_BASE_DELAY, min: 100, max: 10000 },
      { key: 'RETRY_MAX_DELAY', value: config.RETRY_MAX_DELAY, min: 1000, max: 60000 }
    ];

    for (const numConfig of numericConfigs) {
      if (numConfig.value < numConfig.min || numConfig.value > numConfig.max) {
        warnings.push(`${numConfig.key} value ${numConfig.value} is outside recommended range ${numConfig.min}-${numConfig.max}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ============================================================================
// Configuration Utilities
// ============================================================================

export class ConfigurationUtils {
  /**
   * Get environment variable with fallback
   */
  static getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value && !defaultValue) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value || defaultValue!;
  }

  /**
   * Get numeric environment variable
   */
  static getNumericEnvVar(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (!value) {
      if (defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is required but not set`);
      }
      return defaultValue;
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`);
    }
    
    return numValue;
  }

  /**
   * Get boolean environment variable
   */
  static getBooleanEnvVar(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (!value) {
      if (defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is required but not set`);
      }
      return defaultValue;
    }
    
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }

  /**
   * Mask sensitive configuration values for logging
   */
  static maskSensitiveConfig(config: Record<string, any>): Record<string, any> {
    const masked = { ...config };
    const sensitiveKeys = ['key', 'secret', 'password', 'token', 'credential'];
    
    for (const [key, value] of Object.entries(masked)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        if (typeof value === 'string' && value.length > 0) {
          masked[key] = `${value.substring(0, 4)}****${value.substring(value.length - 4)}`;
        }
      }
    }
    
    return masked;
  }

  /**
   * Validate configuration object structure
   */
  static validateConfigStructure(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required properties exist
    const requiredProps = ENVIRONMENT_VARIABLES
      .filter(env => env.required)
      .map(env => env.key.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()));

    for (const prop of requiredProps) {
      if (!(prop in config) || config[prop] === undefined || config[prop] === null) {
        errors.push(`Missing required configuration property: ${prop}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ============================================================================
// Export Configuration Factory
// ============================================================================

export function createEnvironmentConfig(): EnvironmentConfig {
  const loader = EnvironmentConfigLoader.getInstance();
  return loader.loadConfig();
}

export function validateEnvironmentConfig(): ValidationResult {
  const validator = new EnvironmentConfigValidator();
  return validator.validateEnvironment();
}

export function getConfigSummary(): Record<string, any> {
  const loader = EnvironmentConfigLoader.getInstance();
  return loader.getConfigSummary();
}