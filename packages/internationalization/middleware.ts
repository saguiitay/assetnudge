import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { createI18nMiddleware } from 'next-international/middleware';
import type { NextRequest } from 'next/server';
import languine from './languine.json';

const locales = [languine.locale.source, ...languine.locale.targets];

const I18nMiddleware = createI18nMiddleware({
  locales,
  defaultLocale: 'en',
  urlMappingStrategy: 'rewriteDefault',
  resolveLocaleFromRequest: (request: NextRequest) => {
    try {
      const headers = Object.fromEntries(request.headers.entries());
      
      const negotiator = new Negotiator({ headers });
      const acceptedLanguages = negotiator.languages();

      // Filter out invalid language codes that might cause issues
      const validLanguages = acceptedLanguages.filter((lang) => {
        // Basic validation for language codes
        return lang && typeof lang === 'string' && lang !== '*' && /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)*$/.test(lang);
      });

      if (validLanguages.length === 0) {
        return 'en';
      }

      const matchedLocale = matchLocale(validLanguages, locales, 'en');

      return matchedLocale;
    } catch (error) {
      console.error('Error resolving locale from request:', error);
      return 'en';
    }
  },
});export function internationalizationMiddleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
