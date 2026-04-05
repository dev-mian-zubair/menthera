/**
 * Structured Logger with Correlation IDs
 * Provides consistent logging format across all Lambda functions with request correlation
 */

import { randomUUID } from 'crypto';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  correlationId?: string;
  userId?: string;
  agentId?: string;
  callId?: string;
  service?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    type: string;
  };
}

/**
 * Logger class for structured logging with correlation IDs
 */
export class Logger {
  private correlationId: string;
  private context: LogContext;
  private service: string;
  private minLevel: LogLevel;

  constructor(service: string, correlationId?: string, context: LogContext = {}) {
    this.service = service;
    this.correlationId = correlationId || randomUUID();
    this.context = context;

    // Set minimum log level from environment (default INFO)
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
    this.minLevel = envLevel || LogLevel.INFO;
  }

  /**
   * Get current correlation ID
   */
  public getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Update logger context (e.g., add userId after authentication)
   */
  public setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Create a child logger with additional context
   */
  public child(additionalContext: LogContext): Logger {
    return new Logger(this.service, this.correlationId, {
      ...this.context,
      ...additionalContext,
    });
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      context: {
        service: this.service,
        ...this.context,
        ...context,
      },
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
      };
    }

    // Output as JSON for CloudWatch Logs Insights
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Create logger from API Gateway event
   */
  public static fromApiGatewayEvent(event: any, service: string): Logger {
    const correlationId =
      event.headers?.['x-correlation-id'] ||
      event.headers?.['X-Correlation-Id'] ||
      event.requestContext?.requestId ||
      randomUUID();

    return new Logger(service, correlationId, {
      requestId: event.requestContext?.requestId,
      httpMethod: event.httpMethod,
      path: event.path,
      sourceIp: event.requestContext?.identity?.sourceIp,
    });
  }

  /**
   * Create logger from SQS event
   */
  public static fromSqsEvent(record: any, service: string): Logger {
    const correlationId =
      record.messageAttributes?.correlationId?.stringValue ||
      record.messageId ||
      randomUUID();

    return new Logger(service, correlationId, {
      messageId: record.messageId,
      eventSource: record.eventSource,
    });
  }
}

/**
 * Example usage:
 *
 * // In Lambda handler
 * const logger = Logger.fromApiGatewayEvent(event, 'CreateCallHandler');
 *
 * logger.info('Processing call request', { agentId: 'agent-123' });
 *
 * // After authentication
 * logger.setContext({ userId: 'user-456' });
 *
 * logger.info('User authenticated');
 *
 * try {
 *   // Do work
 * } catch (error) {
 *   logger.error('Failed to create call', error as Error, {
 *     agentId: 'agent-123'
 *   });
 * }
 *
 * // Pass correlation ID to downstream services
 * const correlationId = logger.getCorrelationId();
 */
