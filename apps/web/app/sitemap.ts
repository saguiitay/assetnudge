import { categoriesMetadata } from '@/lib/category-data';
import type { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000'

  let pages = [
    {
      url: `${siteUrl}` ,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/categories` ,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9
    }
  ] as MetadataRoute.Sitemap;

  categoriesMetadata.forEach((category) => {
    pages.push({
      url: `${siteUrl}/categories/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8
    });
  });

  return pages;
}