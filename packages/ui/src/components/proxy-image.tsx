/**
 * ProxyImage Component for Design System
 * Automatically handles Unity Asset Store image CORS issues using the proxy server
 */

'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@workspace/ui/lib/utils';

// Define Unity Asset Store domains that need proxying
const UNITY_DOMAINS = [
  'assetstorev1-prd-cdn.unity3d.com',
  'cdn.unity3d.com',
  'connect-prd-cdn.unity.com',
  'assetstore-keyimage.unity.com'
];

/**
 * Check if an image URL is from Unity Asset Store and needs proxying
 */
function needsProxy(url: string): boolean {
  if (!url) return false;
  
  try {
    // Handle protocol-relative URLs
    let fullUrl = url;
    if (url.startsWith('//')) {
      fullUrl = 'https:' + url;
    }
    
    const urlObj = new URL(fullUrl);
    return UNITY_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Get the API base URL from environment variable
 */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '';
  }
  return '';
}

/**
 * Generate proxied image URL for Unity Asset Store images
 */
function getProxiedImageUrl(url: string): string {
  if (!url || !needsProxy(url)) return url;

  // Handle protocol-relative URLs by converting to full URLs
  let fullUrl = url;
  if (url.startsWith('//')) {
    fullUrl = 'https:' + url;
  }

  const params = new URLSearchParams({ url: fullUrl });
  const apiBaseUrl = getApiBaseUrl();
  const proxyPath = '/proxy/image';
  
  if (apiBaseUrl) {
    return `${apiBaseUrl}${proxyPath}?${params.toString()}`;
  } else {
    return `${proxyPath}?${params.toString()}`;
  }
}

export interface ProxyImageProps extends Omit<React.ComponentProps<typeof Image>, 'src'> {
  /** Original image URL */
  src: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Alternative image source if proxy fails */
  fallbackSrc?: string;
  /** Show loading state */
  showLoading?: boolean;
  /** Custom className for the container */
  containerClassName?: string;
}

interface ImageState {
  loading: boolean;
  error: boolean;
  usingProxy: boolean;
}

/**
 * Smart image component that automatically uses proxy for Unity Asset Store images
 */
export function ProxyImage({
  src,
  width,
  height,
  fallbackSrc,
  showLoading = true,
  alt = '',
  className,
  containerClassName,
  onLoad,
  onError,
  ...imgProps
}: ProxyImageProps) {
  const [state, setState] = useState<ImageState>({
    loading: true,
    error: false,
    usingProxy: needsProxy(src)
  });

  const [currentSrc, setCurrentSrc] = useState(() => getProxiedImageUrl(src));

  // Reset state when src changes
  React.useEffect(() => {
    setState({
      loading: true,
      error: false,
      usingProxy: needsProxy(src)
    });
    setCurrentSrc(getProxiedImageUrl(src));
  }, [src]);

  const handleLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setState(prev => ({ ...prev, loading: false, error: false }));
    onLoad?.(event);
  }, [onLoad]);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setState(prev => ({
      ...prev,
      loading: false,
      error: true
    }));

    onError?.(event);
  }, [onError]);

  // Show error state
  if (state.error) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center gap-3 bg-muted rounded-lg border p-4 min-h-[100px]',
        containerClassName
      )}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <svg 
            className="h-8 w-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <span className="text-sm text-center">Failed to load image</span>
        </div>
      </div>
    );
  }

  // Always render the image element, but show loading overlay if needed
  return (
    <div className={cn('relative', containerClassName)}>
      {/* Loading overlay */}
      {state.loading && showLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80 rounded-lg">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">Loading image...</span>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      <Image
        {...imgProps}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-200',
          state.loading ? 'opacity-30' : 'opacity-100',
          className
        )}
      />
    </div>
  );
}

export default ProxyImage;