/**
 * Structured Logging Module
 * Provides consistent logging throughout the Unity Asset Optimizer
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
}

interface ErrorData {
  message: string;
  stack?: string;
  name: string;
}

interface LogData {
  [key: string]: any;
  error?: ErrorData;
}

interface ProgressData {
  current: number;
  total: number;
  percent: number;
  [key: string]: any;
}

export class Logger {
  private context: string;
  private debugMode: boolean;
  private startTime: number;

  constructor(context: string = 'optimizer', debugMode: boolean = false) {
    this.context = context;
    this.debugMode = debugMode;
    this.startTime = Date.now();
  }

  /**
   * Format timestamp for logs
   */
  private timestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Format log message with context
   */
  private format(level: LogLevel, message: string, data: any = null): LogEntry {
    const base: LogEntry = {
      timestamp: this.timestamp(),
      level,
      context: this.context,
      message
    };

    if (data) {
      base.data = data;
    }

    return base;
  }

  /**
   * Debug level logging (only when debug enabled)
   */
  debug(message: string, data: any = null): void {
    if (this.debugMode) {
      console.debug(JSON.stringify(this.format('DEBUG', message, data)));
    }
  }

  /**
   * Info level logging
   */
  info(message: string, data: any = null): void {
    console.log(JSON.stringify(this.format('INFO', message, data)));
  }

  /**
   * Warning level logging
   */
  warn(message: string, data: any = null): void {
    console.warn(JSON.stringify(this.format('WARN', message, data)));
  }

  /**
   * Error level logging
   */
  error(message: string, error: Error | null = null, data: any = null): void {
    const logData: LogData = { ...data };
    if (error) {
      logData.error = {
        message: error.message,
        ...(error.stack && { stack: error.stack }),
        name: error.name
      };
    }
    console.error(JSON.stringify(this.format('ERROR', message, logData)));
  }

  /**
   * Success level logging
   */
  success(message: string, data: any = null): void {
    console.log(JSON.stringify(this.format('SUCCESS', message, data)));
  }

  /**
   * Time a function execution
   */
  async time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`Starting ${operation}`);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed ${operation}`, { duration_ms: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed ${operation}`, error as Error, { duration_ms: duration });
      throw error;
    }
  }

  /**
   * Log operation progress
   */
  progress(operation: string, current: number, total: number, additional: Record<string, any> = {}): void {
    const percent = Math.round((current / total) * 100);
    this.info(`Progress: ${operation}`, {
      current,
      total,
      percent,
      ...additional
    } as ProgressData);
  }

  /**
   * Log performance metrics
   */
  metrics(operation: string, metrics: Record<string, any>): void {
    this.info(`Metrics: ${operation}`, metrics);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`, this.debugMode);
  }
}

/**
 * Simple console logger for backwards compatibility
 */
export class SimpleLogger {
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  debug(message: string): void {
    if (this.debugMode) {
      console.debug(`[DEBUG] ${message}`);
    }
  }

  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }

  success(message: string): void {
    console.log(`[SUCCESS] ${message}`);
  }
}

export default Logger;