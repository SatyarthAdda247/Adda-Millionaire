/**
 * Core TypeScript interfaces for API Integration Reliability system
 * Implements interfaces defined in the design document
 */

// ============================================================================
// Core Data Models
// ============================================================================

export interface AffiliateUser {
  id: string;
  email: string;
  status: UserStatus;
  approvedAt?: Date;
  links: AffiliateLink[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateLink {
  id: string;
  userId: string;
  templateId: string;
  trackingUrl: string;
  createdAt: Date;
  status: LinkStatus;
  appTroveId?: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface LinkStats {
  linkId: string;
  clicks: number;
  conversions: number;
  revenue: number;
  lastUpdated: Date;
}

export interface APIHealthMetrics {
  endpoint: string;
  successRate: number;
  averageLatency: number;
  lastChecked: Date;
  consecutiveFailures: number;
  status: EndpointStatus;
}

export interface LinkCreationRequest {
  userId: string;
  templateId: string;
  requestId: string;
  attempts: number;
  lastAttempt: Date;
  status: RequestStatus;
}

export interface Discrepancy {
  id: string;
  linkId: string;
  type: DiscrepancyType;
  description: string;
  detectedAt: Date;
  resolved: boolean;
}

// ============================================================================
// Enums
// ============================================================================

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

export enum LinkStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum EndpointStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  QUEUED_FOR_MANUAL = 'queued_for_manual'
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export enum CredentialType {
  SDK_KEY = 'sdk_key',
  S2S_API_KEY = 's2s_api_key',
  SECRET_ID = 'secret_id',
  SECRET_KEY = 'secret_key',
  REPORTING_API_KEY = 'reporting_api_key'
}

export enum AuthMethod {
  SDK_KEY = 'sdk_key',
  S2S_API = 's2s_api',
  SECRET_CREDENTIALS = 'secret_credentials',
  REPORTING_API = 'reporting_api'
}

export enum DiscrepancyType {
  CLICK_MISMATCH = 'click_mismatch',
  CONVERSION_MISMATCH = 'conversion_mismatch',
  REVENUE_MISMATCH = 'revenue_mismatch',
  MISSING_DATA = 'missing_data'
}

// ============================================================================
// API and Network Types
// ============================================================================

export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface APIResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  success: boolean;
}

export interface APIError extends Error {
  status?: number;
  code?: string;
  retryable: boolean;
  endpoint?: string;
}

export interface APICredentials {
  sdkKey: string;
  s2sApiKey: string;
  secretId: string;
  secretKey: string;
  reportingApiKey: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface CircuitBreakerConfig {
  failureThreshold: number; // 5 failures
  recoveryTimeout: number; // 60 seconds
  monitoringPeriod: number; // 300 seconds
}

export interface RetryConfig {
  maxAttempts: number; // 3
  baseDelay: number; // 1000ms
  maxDelay: number; // 10000ms
  backoffMultiplier: number; // 2
  jitterRange: number; // 0.1
}

export interface FallbackResult {
  success: boolean;
  message: string;
  requiresManualIntervention: boolean;
  estimatedResolution?: Date;
}

export interface FallbackResponse {
  type: 'temporary' | 'manual_required' | 'system_error';
  message: string;
  requestId: string;
  estimatedResolution?: Date;
}

export interface APIFailure {
  endpoint: string;
  error: APIError;
  timestamp: Date;
  requestId: string;
  userId?: string;
  context: Record<string, any>;
}

// ============================================================================
// Component Interfaces
// ============================================================================

export interface CORSProxyHandler {
  proxyRequest(request: APIRequest): Promise<APIResponse>;
  validateOrigin(origin: string): boolean;
  addCORSHeaders(response: APIResponse): APIResponse;
  handlePreflightRequest(request: APIRequest): APIResponse;
}

export interface AuthenticationManager {
  getCredentialsForEndpoint(endpoint: string): APICredentials;
  validateCredentials(): Promise<ValidationResult>;
  rotateCredentials(credentialType: CredentialType): Promise<void>;
  selectAuthMethod(endpoint: string): AuthMethod;
}

export interface LinkCreationManager {
  createAffiliateLink(userId: string, templateId: string): Promise<AffiliateLink>;
  processUserApproval(userId: string): Promise<void>;
  validateTemplate(templateId: string): Promise<boolean>;
  queueFailedRequest(request: LinkCreationRequest): Promise<void>;
}

export interface TemplateManager {
  fetchTemplates(): Promise<Template[]>;
  validateTemplate(templateId: string): Promise<boolean>;
  getCachedTemplate(templateId: string): Template | null;
  refreshTemplateCache(): Promise<void>;
  mapInternalCategoryToTemplate(category: string): string[];
}

export interface AnalyticsSynchronizer {
  syncAnalytics(): Promise<void>;
  fetchRealTimeStats(linkId: string): Promise<LinkStats>;
  updateLocalMetrics(stats: LinkStats[]): Promise<void>;
  detectDiscrepancies(): Promise<Discrepancy[]>;
}

export interface CircuitBreaker {
  executeRequest<T>(operation: () => Promise<T>): Promise<T>;
  getState(): CircuitState;
  recordSuccess(): void;
  recordFailure(): void;
  reset(): void;
}

export interface RetryEngine {
  executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T>;
  calculateBackoff(attempt: number): number;
  shouldRetry(error: APIError): boolean;
}

export interface FallbackSystem {
  handleAPIFailure(request: LinkCreationRequest): Promise<FallbackResult>;
  notifyAdministrators(failure: APIFailure): Promise<void>;
  queueForManualProcessing(request: LinkCreationRequest): Promise<void>;
  generateTemporaryResponse(request: LinkCreationRequest): FallbackResponse;
}

// ============================================================================
// Logging and Monitoring Types
// ============================================================================

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context: Record<string, any>;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
  error?: APIError;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface Logger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
  fatal(message: string, error?: Error, context?: Record<string, any>): void;
}

// ============================================================================
// Environment and Configuration Types
// ============================================================================

export interface EnvironmentConfig {
  // AppTrove API Configuration
  APPTROVE_SDK_KEY: string;
  APPTROVE_S2S_API_KEY: string;
  APPTROVE_SECRET_ID: string;
  APPTROVE_SECRET_KEY: string;
  APPTROVE_REPORTING_API_KEY: string;
  
  // Database Configuration
  AWS_REGION: string;
  DYNAMODB_TABLE_PREFIX: string;
  
  // System Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: LogLevel;
  
  // Circuit Breaker Configuration
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: number;
  CIRCUIT_BREAKER_RECOVERY_TIMEOUT: number;
  
  // Retry Configuration
  RETRY_MAX_ATTEMPTS: number;
  RETRY_BASE_DELAY: number;
  RETRY_MAX_DELAY: number;
  
  // Monitoring Configuration
  HEALTH_CHECK_INTERVAL: number;
  ANALYTICS_SYNC_INTERVAL: number;
  
  // Notification Configuration
  ADMIN_EMAIL: string;
  NOTIFICATION_SERVICE_URL?: string;
}

export interface ConfigValidator {
  validateEnvironment(): ValidationResult;
  getRequiredVariables(): string[];
  getOptionalVariables(): string[];
  validateCredentials(): Promise<ValidationResult>;
}