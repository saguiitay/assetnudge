import { env } from '@/env';
import { NextRequest } from 'next/server';

/**
 * Validates that the request origin matches NEXT_PUBLIC_APP_URL
 * @param request - The NextRequest object
 * @returns boolean - true if origin is allowed, false otherwise
 */
export function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // For non-browser requests (like server-to-server), allow if no origin/referer
  if (!origin && !referer) {
    return true;
  }
  
  const allowedUrl = env.NEXT_PUBLIC_APP_URL;
  
  // Check origin header first
  if (origin) {
    return origin === allowedUrl;
  }
  
  // Fallback to referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const allowedUrlObj = new URL(allowedUrl);
      return refererUrl.origin === allowedUrlObj.origin;
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Gets CORS headers with the allowed origin
 * @param request - The NextRequest object
 * @returns HeadersInit object with appropriate CORS headers
 */
export function getCorsHeaders(request?: NextRequest): HeadersInit {
  const allowedOrigin = env.NEXT_PUBLIC_APP_URL;
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Validates origin and returns CORS headers or null if invalid
 * @param request - The NextRequest object
 * @returns HeadersInit object if valid origin, null if invalid
 */
export function validateOriginAndGetCorsHeaders(request: NextRequest): HeadersInit | null {
  if (!isValidOrigin(request)) {
    return null;
  }
  
  return getCorsHeaders(request);
}