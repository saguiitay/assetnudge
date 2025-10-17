import { NextRequest, NextResponse } from 'next/server';
import { validateOriginAndGetCorsHeaders } from '@/lib/cors';

export const runtime = 'edge';

export const GET = (request: NextRequest): Response => {
  const corsHeaders = validateOriginAndGetCorsHeaders(request);
  if (!corsHeaders) {
    return new Response(null, { status: 403 });
  }
  return new Response('OK', { status: 200, headers: corsHeaders });
};
