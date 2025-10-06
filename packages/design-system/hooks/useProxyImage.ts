"use client";

/**
 * React Hook for Image Proxy
 * Provides easy integration with the Unity Asset Store image proxy
 */

import { useState, useEffect, useCallback } from 'react';
import { smartImageUrl, needsProxy } from '../lib/proxy-utils';

export interface UseProxyImageOptions {
  /** Enable automatic proxy for Unity Asset Store images */
  autoProxy?: boolean;
  /** Enable retry on error */
  enableRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Fallback image URL */
  fallbackSrc?: string;
}

export interface UseProxyImageState {
  /** Current image source (may be proxied) */
  src: string;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: boolean;
  /** Number of retry attempts */
  retryCount: number;
  /** Whether currently using proxy */
  usingProxy: boolean;
  /** Retry function */
  retry: () => void;
}

/**
 * Hook for handling image proxy functionality
 * @param originalSrc - Original image URL
 * @param options - Proxy options
 * @returns Proxy state and controls
 */
export function useProxyImage(
  originalSrc: string, 
  options: UseProxyImageOptions = {}
): UseProxyImageState {
  const {
    autoProxy = true,
    enableRetry = true,
    maxRetries = 2,
    fallbackSrc
  } = options;

  const [state, setState] = useState(() => ({
    src: autoProxy ? smartImageUrl(originalSrc) : originalSrc,
    loading: false,
    error: false,
    retryCount: 0,
    usingProxy: autoProxy && needsProxy(originalSrc)
  }));

  // Update source when originalSrc changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      src: autoProxy ? smartImageUrl(originalSrc) : originalSrc,
      usingProxy: autoProxy && needsProxy(originalSrc),
      error: false,
      retryCount: 0
    }));
  }, [originalSrc, autoProxy]);

  const retry = useCallback(() => {
    setState(prev => {
      const newRetryCount = prev.retryCount + 1;
      
      // Try different strategies based on retry count
      let newSrc = originalSrc;
      let newUsingProxy = false;

      if (enableRetry && newRetryCount <= maxRetries) {
        // First retry: try with proxy if not already using it
        if (!prev.usingProxy && needsProxy(originalSrc)) {
          newSrc = smartImageUrl(originalSrc);
          newUsingProxy = true;
        }
        // Second retry: try fallback if available
        else if (fallbackSrc && newRetryCount === maxRetries) {
          newSrc = fallbackSrc;
          newUsingProxy = false;
        }
        // Further retries: keep trying the same strategy
        else {
          newSrc = prev.src;
          newUsingProxy = prev.usingProxy;
        }
      }

      return {
        src: newSrc,
        loading: true,
        error: false,
        retryCount: newRetryCount,
        usingProxy: newUsingProxy
      };
    });
  }, [originalSrc, enableRetry, maxRetries, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setState(prev => ({ ...prev, loading: false, error: false }));
  }, []);

  const handleError = useCallback(() => {
    setState(prev => {
      // Auto-retry if enabled and retries remaining
      if (enableRetry && prev.retryCount < maxRetries) {
        // Trigger retry automatically
        setTimeout(() => retry(), 100);
        return prev;
      }

      return { ...prev, loading: false, error: true };
    });
  }, [enableRetry, maxRetries, retry]);

  return {
    ...state,
    retry,
    // Expose handlers for manual use
    onLoad: handleLoad,
    onError: handleError
  } as UseProxyImageState & {
    onLoad: () => void;
    onError: () => void;
  };
}

/**
 * Simple hook that just returns the proxied URL
 * @param originalSrc - Original image URL
 * @returns Proxied URL if needed, otherwise original URL
 */
export function useProxiedUrl(originalSrc: string): string {
  return smartImageUrl(originalSrc);
}

export default useProxyImage;