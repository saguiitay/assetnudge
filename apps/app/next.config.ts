import { env } from '@/env';
import { config, withAnalyzer } from '@repo/next-config';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = config;

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

nextConfig.images = {
  domains: [
    // Add your allowed image domains here
    'assetstorev1-prd-cdn.unity3d.com',
    'cdn.unity3d.com',
    'connect-prd-cdn.unity.com',
    'assetstore-keyimage.unity.com',
    'localhost',
    // Add other domains as needed
    new URL(process.env.NEXT_PUBLIC_API_URL!).hostname,
  ],
}

export default nextConfig;
