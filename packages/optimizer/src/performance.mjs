/**
 * Performance Optimization Module
 * Provides caching, memory optimization, and performance monitoring
 */

import { Logger } from './utils/logger.mjs';

const logger = new Logger('performance');

/**
 * Simple in-memory cache for expensive operations
 */
export class MemoryCache {
  constructor(maxSize = 1000, ttlMs = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.hits = 0;
    this.misses = 0;
    this.logger = logger.child('cache');
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value) {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      ttlMs: this.ttlMs
    };
  }
}

/**
 * TF-IDF vector cache for expensive calculations
 */
export class TFIDFCache extends MemoryCache {
  constructor() {
    super(500, 600000); // 10 minutes TTL for TF-IDF vectors
    this.logger = logger.child('tfidf-cache');
  }

  /**
   * Get or compute TF-IDF vector with caching
   */
  async getOrCompute(text, computeFn) {
    const key = this.hashText(text);
    let vector = this.get(key);

    if (vector === null) {
      this.logger.debug('Computing TF-IDF vector', { textLength: text.length });
      vector = computeFn(text);
      this.set(key, vector);
    } else {
      this.logger.debug('TF-IDF vector cache hit');
    }

    return vector;
  }

  /**
   * Simple hash function for text
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

/**
 * Performance monitor for tracking operation metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.logger = logger.child('monitor');
  }

  /**
   * Start timing an operation
   */
  startTimer(operation) {
    return {
      operation,
      startTime: process.hrtime.bigint(),
      startMemory: process.memoryUsage()
    };
  }

  /**
   * End timing and record metrics
   */
  endTimer(timer) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - timer.startTime) / 1e6; // Convert to milliseconds
    const memoryDelta = {
      heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - timer.startMemory.heapTotal,
      external: endMemory.external - timer.startMemory.external
    };

    const metric = {
      operation: timer.operation,
      duration,
      memoryDelta,
      timestamp: Date.now()
    };

    // Store metrics
    if (!this.metrics.has(timer.operation)) {
      this.metrics.set(timer.operation, []);
    }
    this.metrics.get(timer.operation).push(metric);

    // Keep only last 100 metrics per operation
    const operationMetrics = this.metrics.get(timer.operation);
    if (operationMetrics.length > 100) {
      operationMetrics.splice(0, operationMetrics.length - 100);
    }

    this.logger.debug('Operation completed', {
      operation: timer.operation,
      duration: `${duration.toFixed(2)}ms`,
      memoryDelta: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`
    });

    return metric;
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation) {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics || operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map(m => m.duration);
    const memoryUsages = operationMetrics.map(m => m.memoryDelta.heapUsed);

    return {
      operation,
      count: operationMetrics.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        total: durations.reduce((a, b) => a + b, 0)
      },
      memory: {
        minDelta: Math.min(...memoryUsages),
        maxDelta: Math.max(...memoryUsages),
        avgDelta: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
      },
      lastRun: operationMetrics[operationMetrics.length - 1].timestamp
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats() {
    const stats = {};
    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getStats(operation);
    }
    return stats;
  }

  /**
   * Time an async function
   */
  async timeAsync(operation, fn) {
    const timer = this.startTimer(operation);
    try {
      const result = await fn();
      this.endTimer(timer);
      return result;
    } catch (error) {
      this.endTimer(timer);
      throw error;
    }
  }

  /**
   * Time a sync function
   */
  timeSync(operation, fn) {
    const timer = this.startTimer(operation);
    try {
      const result = fn();
      this.endTimer(timer);
      return result;
    } catch (error) {
      this.endTimer(timer);
      throw error;
    }
  }
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  constructor() {
    this.snapshots = [];
    this.logger = logger.child('memory');
  }

  /**
   * Take a memory snapshot
   */
  snapshot(label = 'anonymous') {
    const usage = process.memoryUsage();
    const snapshot = {
      label,
      timestamp: Date.now(),
      ...usage
    };
    
    this.snapshots.push(snapshot);
    
    // Keep only last 50 snapshots
    if (this.snapshots.length > 50) {
      this.snapshots.splice(0, this.snapshots.length - 50);
    }

    this.logger.debug('Memory snapshot', {
      label,
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`
    });

    return snapshot;
  }

  /**
   * Get memory usage difference between two snapshots
   */
  compare(label1, label2) {
    const snapshot1 = this.snapshots.find(s => s.label === label1);
    const snapshot2 = this.snapshots.find(s => s.label === label2);

    if (!snapshot1 || !snapshot2) {
      return null;
    }

    return {
      heapUsedDelta: snapshot2.heapUsed - snapshot1.heapUsed,
      heapTotalDelta: snapshot2.heapTotal - snapshot1.heapTotal,
      externalDelta: snapshot2.external - snapshot1.external,
      timeDelta: snapshot2.timestamp - snapshot1.timestamp
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGC() {
    if (global.gc) {
      this.logger.debug('Forcing garbage collection');
      global.gc();
      return true;
    } else {
      this.logger.warn('Garbage collection not available (run with --expose-gc)');
      return false;
    }
  }
}

/**
 * Batch processor for handling large datasets efficiently
 */
export class BatchProcessor {
  constructor(batchSize = 100, delayMs = 10) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
    this.logger = logger.child('batch');
  }

  /**
   * Process items in batches with optional delay
   */
  async processBatches(items, processFn, onProgress = null) {
    const results = [];
    const totalBatches = Math.ceil(items.length / this.batchSize);

    this.logger.info('Starting batch processing', {
      totalItems: items.length,
      batchSize: this.batchSize,
      totalBatches
    });

    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;

      this.logger.debug(`Processing batch ${batchNumber}/${totalBatches}`, {
        batchSize: batch.length,
        startIndex: i
      });

      try {
        const batchResults = await processFn(batch, batchNumber);
        results.push(...batchResults);

        if (onProgress) {
          onProgress(batchNumber, totalBatches, results.length);
        }

        // Small delay to prevent overwhelming the system
        if (this.delayMs > 0 && batchNumber < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, this.delayMs));
        }

      } catch (error) {
        this.logger.error(`Batch ${batchNumber} failed`, error);
        throw error;
      }
    }

    this.logger.success('Batch processing completed', {
      totalItems: items.length,
      processedItems: results.length,
      batches: totalBatches
    });

    return results;
  }
}

// Global instances
export const tfidCache = new TFIDFCache();
export const performanceMonitor = new PerformanceMonitor();
export const memoryTracker = new MemoryTracker();

export default {
  MemoryCache,
  TFIDFCache,
  PerformanceMonitor,
  MemoryTracker,
  BatchProcessor,
  tfidCache,
  performanceMonitor,
  memoryTracker
};