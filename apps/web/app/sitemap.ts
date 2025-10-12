import type { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000'

  let pages = [
    {
      url: `${siteUrl}` ,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    }
  ] as MetadataRoute.Sitemap;



  return pages;
}