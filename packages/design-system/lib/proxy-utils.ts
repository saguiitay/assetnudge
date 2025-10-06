/**
 * Simplified proxy utilities for media gallery components
 * This provides a lightweight wrapper for the most common use cases
 */

/**
 * Get the API base URL from environment variable
 */
function getApiBaseUrl(): string {
  // In client-side, use NEXT_PUBLIC_API_URL if available
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '';
  }
  return '';
}

/**
 * Smart image URL that automatically uses proxy for Unity Asset Store images
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return '';

  try {
    // Handle protocol-relative URLs
    let fullUrl = url;
    if (url.startsWith('//')) {
      fullUrl = 'https:' + url;
    }
    
    const urlObj = new URL(fullUrl);
    const unityDomains = [
      'assetstorev1-prd-cdn.unity3d.com',
      'cdn.unity3d.com',
      'connect-prd-cdn.unity.com',
      'assetstore-keyimage.unity.com'
    ];
    
    const needsProxy = unityDomains.some(domain => urlObj.hostname.includes(domain));
    
    if (needsProxy) {
      const params = new URLSearchParams({ url: fullUrl });
      const apiBaseUrl = getApiBaseUrl();
      const proxyPath = '/proxy/image';
      
      // Use full URL if API base URL is provided, otherwise relative path
      if (apiBaseUrl) {
        return `${apiBaseUrl}${proxyPath}?${params.toString()}`;
      } else {
        return `${proxyPath}?${params.toString()}`;
      }
    }
  } catch {
    // Invalid URL, return with protocol if missing
    return url.startsWith('//') ? 'https:' + url : url;
  }

  // Return the full URL (with protocol added if it was missing)
  return url.startsWith('//') ? 'https:' + url : url;
}

/**
 * Check if an image URL is from Unity Asset Store and needs proxying
 */
export function needsProxy(url: string): boolean {
  if (!url) return false;
  
  try {
    // Handle protocol-relative URLs
    let fullUrl = url;
    if (url.startsWith('//')) {
      fullUrl = 'https:' + url;
    }
    
    const urlObj = new URL(fullUrl);
    const unityDomains = [
      'assetstorev1-prd-cdn.unity3d.com',
      'cdn.unity3d.com',
      'connect-prd-cdn.unity.com',
      'assetstore-keyimage.unity.com'
    ];
    
    return unityDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Smart image URL that automatically uses proxy for Unity Asset Store images
 * @param originalUrl - Original image URL
 * @param options - Additional proxy options (for future features)
 * @returns Proxied URL if needed, otherwise original URL
 */
export function smartImageUrl(originalUrl: string, options: { width?: number; height?: number; quality?: number } = {}): string {
  if (!originalUrl) {
    return '';
  }

  // Handle protocol-relative URLs first
  let processedUrl = originalUrl;
  if (originalUrl.startsWith('//')) {
    processedUrl = 'https:' + originalUrl;
  }

  if (needsProxy(processedUrl)) {
    return getProxiedImageUrl(originalUrl); // Pass original URL to preserve format
  }

  return processedUrl; // Return the processed URL with protocol
}