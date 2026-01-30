/**
 * Structured logging infrastructure
 * Implements comprehensive logging with structured data and context tracking
 */

import { Logger, LogEntry, LogLevel } from '../types';

// ============================================================================
// Log Formatting and Serialization
// ============================================================================

interface LogFormatter {
  format(entry: LogEntry): string;
}

export class JSONLogFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const logObject = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      ...entry.context,
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.endpoint && { endpoint: entry.endpoint }),
      ...(entry.duration && { duration: entry.duration }),
      ...(entry.error && {
        error: {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
          ...(entry.error.status && { status: entry.error.status }),
          ...(entry.error.code && { code: entry.error.code }),
          retryable: entry.error.retryable
        }
      })
    };

    return JSON.stringify(logObject);
  }
}

export class ConsoleLogFormatter implements LogFormatter {
  private colors = {
    [LogLevel.DEBUG]: '\x1b[36m', // Cyan
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.FATAL]: '\x1b[35m'  // Magenta
  };

  private reset = '\x1b[0m';

  format(entry: LogEntry): string {
    const color = this.colors[entry.level] || '';
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    
    let message = `${color}[${timestamp}] ${level}${this.reset} ${entry.message}`;
    
    // Add context information
    if (entry.requestId) {
      message += ` [req:${entry.requestId}]`;
    }
    
    if (entry.userId) {
      message += ` [user:${entry.userId}]`;
    }
    
    if (entry.endpoint) {
      message += ` [endpoint:${entry.endpoint}]`;
    }
    
    if (entry.duration) {
      message += ` [${entry.duration}ms]`;
    }

    // Add context data
    if (Object.keys(entry.context).length > 0) {
      message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    // Add error information
    if (entry.error) {
      message += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return message;
  }
}

// ============================================================================
// Log Transport Interface
// ============================================================================

interface LogTransport {
  write(entry: LogEntry): Promise<void>;
  close(): Promise<void>;
}

export class ConsoleTransport implements LogTransport {
  private formatter: LogFormatter;

  constructor(formatter: LogFormatter = new ConsoleLogFormatter()) {
    this.formatter = formatter;
  }

  async write(entry: LogEntry): Promise<void> {
    const formatted = this.formatter.format(entry);
    
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }

  async close(): Promise<void> {
    // Console transport doesn't need cleanup
  }
}

export class FileTransport implements LogTransport {
  private formatter: LogFormatter;
  private filePath: string;
  private writeStream: any; // Would be fs.WriteStream in Node.js

  constructor(filePath: string, formatter: LogFormatter = new JSONLogFormatter()) {
    this.filePath = filePath;
    this.formatter = formatter;
    // In a real implementation, we'd create a write stream here
  }

  async write(entry: LogEntry): Promise<void> {
    const formatted = this.formatter.format(entry);
    // In a real implementation, we'd write to the file stream
    console.log(`[FILE LOG] ${formatted}`);
  }

  async close(): Promise<void> {
    // Close the write stream
  }
}

// ============================================================================
// Context Manager
// ============================================================================

export class LogContext {
  private static instance: LogContext;
  private contextStack: Record<string, any>[] = [];
  private globalContext: Record<string, any> = {};

  private constructor() {}

  static getInstance(): LogContext {
    if (!LogContext.instance) {
      LogContext.instance = new LogContext();
    }
    return LogContext.instance;
  }

  /**
   * Set global context that applies to all log entries
   */
  setGlobalContext(context: Record<string, any>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * Push context onto the stack
   */
  pushContext(context: Record<string, any>): void {
    this.contextStack.push(context);
  }

  /**
   * Pop context from the stack
   */
  popContext(): Record<string, any> | undefined {
    return this.contextStack.pop();
  }

  /**
   * Get current context (global + stacked contexts)
   */
  getCurrentContext(): Record<string, any> {
    return this.contextStack.reduce(
      (acc, context) => ({ ...acc, ...context }),
      { ...this.globalContext }
    );
  }

  /**
   * Clear all context
   */
  clear(): void {
    this.contextStack = [];
    this.globalContext = {};
  }
}

// ============================================================================
// Structured Logger Implementation
// ============================================================================

export class StructuredLogger implements Logger {
  private transports: LogTransport[] = [];
  private minLevel: LogLevel;
  private context: LogContext;
  private requestId?: string;
  private userId?: string;

  constructor(
    minLevel: LogLevel = LogLevel.INFO,
    transports: LogTransport[] = [new ConsoleTransport()]
  ) {
    this.minLevel = minLevel;
    this.transports = transports;
    this.context = LogContext.getInstance();
  }

  /**
   * Set request ID for all subsequent log entries
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Set user ID for all subsequent log entries
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Clear request and user context
   */
  clearContext(): void {
    this.requestId = undefined;
    this.userId = undefined;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context: Record<string, any> = {},
    error?: Error,
    endpoint?: string,
    duration?: number
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      context: { ...this.context.getCurrentContext(), ...context },
      requestId: this.requestId,
      userId: this.userId,
      endpoint,
      duration,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        retryable: (error as any).retryable || false,
        status: (error as any).status,
        code: (error as any).code
      } : undefined
    };
  }

  /**
   * Write log entry to all transports
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const writePromises = this.transports.map(transport => 
      transport.write(entry).catch(err => 
        console.error('Failed to write to log transport:', err)
      )
    );

    await Promise.all(writePromises);
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog(entry);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.writeLog(entry);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.writeLog(entry);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.writeLog(entry);
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, error);
    this.writeLog(entry);
  }

  /**
   * Log API request/response
   */
  logAPICall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    error?: Error,
    context?: Record<string, any>
  ): void {
    const level = error ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `API ${method} ${endpoint} - ${status} (${duration}ms)`;
    
    const entry = this.createLogEntry(
      level,
      message,
      { method, status, ...context },
      error,
      endpoint,
      duration
    );
    
    this.writeLog(entry);
  }

  /**
   * Log business operation
   */
  logOperation(
    operation: string,
    success: boolean,
    duration?: number,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Operation ${operation} ${success ? 'completed' : 'failed'}${duration ? ` (${duration}ms)` : ''}`;
    
    const entry = this.createLogEntry(
      level,
      message,
      { operation, success, ...context },
      error,
      undefined,
      duration
    );
    
    this.writeLog(entry);
  }

  /**
   * Add transport
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Remove transport
   */
  removeTransport(transport: LogTransport): void {
    const index = this.transports.indexOf(transport);
    if (index > -1) {
      this.transports.splice(index, 1);
    }
  }

  /**
   * Close all transports
   */
  async close(): Promise<void> {
    const closePromises = this.transports.map(transport => transport.close());
    await Promise.all(closePromises);
  }
}

// ============================================================================
// Logger Factory
// ============================================================================

export class LoggerFactory {
  private static defaultLogger: StructuredLogger;

  /**
   * Create logger with configuration
   */
  static createLogger(
    minLevel: LogLevel = LogLevel.INFO,
    transports?: LogTransport[]
  ): StructuredLogger {
    const defaultTransports = transports || [
      new ConsoleTransport(
        process.env.NODE_ENV === 'production' 
          ? new JSONLogFormatter() 
          : new ConsoleLogFormatter()
      )
    ];

    return new StructuredLogger(minLevel, defaultTransports);
  }

  /**
   * Get default logger instance
   */
  static getDefaultLogger(): StructuredLogger {
    if (!LoggerFactory.defaultLogger) {
      const logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
      LoggerFactory.defaultLogger = LoggerFactory.createLogger(logLevel);
      
      // Set global context
      const context = LogContext.getInstance();
      context.setGlobalContext({
        service: 'api-integration-reliability',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    }
    
    return LoggerFactory.defaultLogger;
  }

  /**
   * Create logger for specific component
   */
  static createComponentLogger(
    component: string,
    minLevel?: LogLevel
  ): StructuredLogger {
    const logger = LoggerFactory.createLogger(minLevel);
    const context = LogContext.getInstance();
    context.pushContext({ component });
    return logger;
  }
}

// ============================================================================
// Logging Utilities
// ============================================================================

export class LoggingUtils {
  /**
   * Create request context middleware
   */
  static createRequestContext(requestId: string, userId?: string) {
    return {
      requestId,
      userId,
      startTime: Date.now()
    };
  }

  /**
   * Measure execution time
   */
  static async measureTime<T>(
    operation: () => Promise<T>,
    logger: Logger,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      logger.info(`${operationName} completed successfully`, {
        duration,
        ...context
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`${operationName} failed`, error as Error, {
        duration,
        ...context
      });
      
      throw error;
    }
  }

  /**
   * Sanitize sensitive data for logging
   */
  static sanitizeForLogging(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential', 'auth'];
    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
      
      if (isSensitive && typeof value === 'string') {
        (sanitized as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = LoggingUtils.sanitizeForLogging(value);
      } else {
        (sanitized as any)[key] = value;
      }
    }

    return sanitized;
  }
}

// Export default logger instance
export const logger = LoggerFactory.getDefaultLogger();