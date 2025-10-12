import { internationalizationMiddleware } from '@repo/internationalization/middleware';
import {
  type NextMiddleware,
  type NextRequest,
  NextResponse,
} from 'next/server';

export const config = {
  // matcher tells Next.js which routes to run the middleware on. This runs the
  // middleware on all routes except for static assets and Posthog ingest
  matcher: ['/((?!_next/static|_next/image|ingest|favicon.ico|robots.txt|sitemap.xml).*)'],
};

const middleware = (request: NextRequest) => {
  const i18nResponse = internationalizationMiddleware(
    request as unknown as NextRequest
  );
  if (i18nResponse) {
    return i18nResponse;
  }

  return NextResponse.next();
};

export default middleware as NextMiddleware;