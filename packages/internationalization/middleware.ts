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
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Request Headers:', headers);
    
    const negotiator = new Negotiator({ headers });
    const acceptedLanguages = negotiator.languages();
    console.log('Accepted Languages:', acceptedLanguages);

    const matchedLocale = matchLocale(acceptedLanguages, locales, 'en');
    console.log('Matched Locale:', matchedLocale);

    return matchedLocale;
  },
});

export function internationalizationMiddleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
