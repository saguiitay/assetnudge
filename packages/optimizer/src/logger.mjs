/**
 * Structured Logging Module
 * Provides consistent logging throughout the Unity Asset Optimizer
 */

export class Logger {
  constructor(context = 'optimizer', debugMode = false) {
    this.context = context;
    this.debugMode = debugMode;
    this.startTime = Date.now();
  }

  /**
   * Format timestamp for logs
   */
  timestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message with context
   */
  format(level, message, data = null) {
    const base = {
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
  debug(message, data = null) {
    if (this.debugMode) {
      console.debug(JSON.stringify(this.format('DEBUG', message, data)));
    }
  }

  /**
   * Info level logging
   */
  info(message, data = null) {
    console.log(JSON.stringify(this.format('INFO', message, data)));
  }

  /**
   * Warning level logging
   */
  warn(message, data = null) {
    console.warn(JSON.stringify(this.format('WARN', message, data)));
  }

  /**
   * Error level logging
   */
  error(message, error = null, data = null) {
    const logData = { ...data };
    if (error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }
    console.error(JSON.stringify(this.format('ERROR', message, logData)));
  }

  /**
   * Success level logging
   */
  success(message, data = null) {
    console.log(JSON.stringify(this.format('SUCCESS', message, data)));
  }

  /**
   * Time a function execution
   */
  async time(operation, fn) {
    const start = Date.now();
    this.debug(`Starting ${operation}`);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed ${operation}`, { duration_ms: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed ${operation}`, error, { duration_ms: duration });
      throw error;
    }
  }

  /**
   * Log operation progress
   */
  progress(operation, current, total, additional = {}) {
    const percent = Math.round((current / total) * 100);
    this.info(`Progress: ${operation}`, {
      current,
      total,
      percent,
      ...additional
    });
  }

  /**
   * Log performance metrics
   */
  metrics(operation, metrics) {
    this.info(`Metrics: ${operation}`, metrics);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext) {
    return new Logger(`${this.context}:${additionalContext}`, this.debugMode);
  }
}

/**
 * Simple console logger for backwards compatibility
 */
export class SimpleLogger {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }

  debug(message) {
    if (this.debugMode) {
      console.debug(`[DEBUG] ${message}`);
    }
  }

  info(message) {
    console.log(`[INFO] ${message}`);
  }

  warn(message) {
    console.warn(`[WARN] ${message}`);
  }

  error(message) {
    console.error(`[ERROR] ${message}`);
  }

  success(message) {
    console.log(`[SUCCESS] ${message}`);
  }
}

export default Logger;