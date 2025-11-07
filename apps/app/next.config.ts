import { env } from '@/env';
import { config, withAnalyzer } from '@repo/next-config';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = config;

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

nextConfig.images = {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'assetstorev1-prd-cdn.unity3d.com',
    },
    {
      protocol: 'https',
      hostname: 'cdn.unity3d.com',
    },
    {
      protocol: 'https',
      hostname: 'connect-prd-cdn.unity.com',
    },
    {
      protocol: 'https',
      hostname: 'assetstore-keyimage.unity.com',
    },
    {
      protocol: 'http',
      hostname: 'localhost',
    },
    {
      protocol: 'https',
      hostname: 'localhost',
    },
    {
      protocol: 'https',
      hostname: new URL(process.env.NEXT_PUBLIC_API_URL!).hostname,
    },
  ],
}

export default nextConfig;
