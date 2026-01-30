/**
 * Infrastructure initialization and setup
 * Provides utilities to initialize and validate the complete infrastructure
 */

import {
  createEnvironmentConfig,
  validateEnvironmentConfig,
  DynamoDBConnection,
  DynamoDBConfigFactory,
  LoggerFactory,
  LogLevel,
  ValidationResult,
  EnvironmentConfig,
  Logger,
  UnifiedCredentialManager,
  CredentialManagerFactory
} from './index';

// ============================================================================
// Infrastructure Initialization
// ============================================================================

export interface InfrastructureConfig {
  environment: EnvironmentConfig;
  database: DynamoDBConnection;
  logger: Logger;
  credentialManager: UnifiedCredentialManager;
}

export class InfrastructureInitializer {
  private static instance: InfrastructureInitializer;
  private config: InfrastructureConfig | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): InfrastructureInitializer {
    if (!InfrastructureInitializer.instance) {
      InfrastructureInitializer.instance = new InfrastructureInitializer();
    }
    return InfrastructureInitializer.instance;
  }

  /**
   * Initialize all infrastructure components
   */
  async initialize(): Promise<InfrastructureConfig> {
    if (this.initialized && this.config) {
      return this.config;
    }

    console.log('🚀 Initializing API Integration Reliability Infrastructure...');

    // Step 1: Validate and load environment configuration
    console.log('📋 Validating environment configuration...');
    const envValidation = validateEnvironmentConfig();
    
    if (!envValidation.valid) {
      console.error('❌ Environment validation failed:');
      envValidation.errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Environment configuration validation failed');
    }

    if (envValidation.warnings.length > 0) {
      console.warn('⚠️  Environment warnings:');
      envValidation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    const environment = createEnvironmentConfig();
    console.log('✅ Environment configuration loaded');

    // Step 2: Initialize logging
    console.log('📝 Initializing logging infrastructure...');
    const logger = LoggerFactory.createLogger(environment.LOG_LEVEL);
    logger.info('Logging infrastructure initialized', {
      logLevel: environment.LOG_LEVEL,
      environment: environment.NODE_ENV
    });

    // Step 3: Initialize database connection
    console.log('🗄️  Initializing database connection...');
    const dbConfig = DynamoDBConfigFactory.fromEnvironment(environment);
    const database = DynamoDBConnection.getInstance(dbConfig, logger);

    // Test database connection
    const dbConnected = await database.testConnection();
    if (!dbConnected) {
      logger.warn('Database connection test failed - continuing with initialization');
      console.warn('⚠️  Database connection test failed - this may be expected in some environments');
    } else {
      logger.info('Database connection established');
      console.log('✅ Database connection established');
    }

    // Step 4: Initialize credential manager
    console.log('🔐 Initializing credential manager...');
    const credentialManager = CredentialManagerFactory.create(environment, logger);
    
    // Step 5: Validate credentials using the credential manager
    console.log('🔍 Validating API credentials...');
    const credentialValidation = await credentialManager.validateCredentials();
    
    if (!credentialValidation.valid) {
      logger.error('Credential validation failed', undefined, {
        errors: credentialValidation.errors
      });
      console.error('❌ Credential validation failed:');
      credentialValidation.errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Credential validation failed');
    }

    if (credentialValidation.warnings.length > 0) {
      credentialValidation.warnings.forEach(warning => {
        logger.warn(warning);
        console.warn(`⚠️  ${warning}`);
      });
    }

    console.log('✅ API credentials validated');
    logger.info('Credential manager initialized', {
      credentialStatus: credentialManager.getCredentialStatus()
    });

    // Step 6: Set up global context
    logger.info('Infrastructure initialization completed', {
      environment: environment.NODE_ENV,
      region: environment.AWS_REGION,
      tablePrefix: environment.DYNAMODB_TABLE_PREFIX
    });

    this.config = {
      environment,
      database,
      logger,
      credentialManager
    };

    this.initialized = true;
    console.log('🎉 Infrastructure initialization completed successfully!');

    return this.config;
  }

  /**
   * Get initialized configuration
   */
  getConfig(): InfrastructureConfig {
    if (!this.config) {
      throw new Error('Infrastructure not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Check if infrastructure is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Cleanup infrastructure
   */
  async cleanup(): Promise<void> {
    if (this.config) {
      this.config.logger.info('Cleaning up infrastructure');
      
      try {
        await this.config.database.close();
        await this.config.logger.close();
        console.log('✅ Infrastructure cleanup completed');
      } catch (error) {
        console.error('❌ Error during infrastructure cleanup:', error);
      }
    }

    this.config = null;
    this.initialized = false;
  }

  /**
   * Reset for testing
   */
  reset(): void {
    this.config = null;
    this.initialized = false;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Initialize infrastructure and return configuration
 */
export async function initializeInfrastructure(): Promise<InfrastructureConfig> {
  const initializer = InfrastructureInitializer.getInstance();
  return await initializer.initialize();
}

/**
 * Get initialized infrastructure configuration
 */
export function getInfrastructureConfig(): InfrastructureConfig {
  const initializer = InfrastructureInitializer.getInstance();
  return initializer.getConfig();
}

/**
 * Check if infrastructure is ready
 */
export function isInfrastructureReady(): boolean {
  const initializer = InfrastructureInitializer.getInstance();
  return initializer.isInitialized();
}

/**
 * Cleanup infrastructure
 */
export async function cleanupInfrastructure(): Promise<void> {
  const initializer = InfrastructureInitializer.getInstance();
  await initializer.cleanup();
}

// ============================================================================
// Health Check Utilities
// ============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  checks: {
    environment: boolean;
    database: boolean;
    logging: boolean;
  };
  details: Record<string, any>;
  timestamp: Date;
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const timestamp = new Date();
  const checks = {
    environment: false,
    database: false,
    logging: false
  };
  const details: Record<string, any> = {};

  try {
    // Check environment configuration
    const envValidation = validateEnvironmentConfig();
    checks.environment = envValidation.valid;
    details.environment = {
      valid: envValidation.valid,
      errors: envValidation.errors,
      warnings: envValidation.warnings
    };

    // Check database connection (if initialized)
    if (isInfrastructureReady()) {
      const config = getInfrastructureConfig();
      checks.database = await config.database.testConnection();
      details.database = {
        connected: checks.database,
        tableName: config.database.getTableName()
      };

      // Check logging
      try {
        config.logger.info('Health check test log entry');
        checks.logging = true;
        details.logging = { working: true };
      } catch (error) {
        checks.logging = false;
        details.logging = { working: false, error: (error as Error).message };
      }
    }

    const healthy = Object.values(checks).every(check => check);

    return {
      healthy,
      checks,
      details,
      timestamp
    };
  } catch (error) {
    return {
      healthy: false,
      checks,
      details: {
        ...details,
        error: (error as Error).message
      },
      timestamp
    };
  }
}