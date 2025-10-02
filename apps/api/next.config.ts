import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic server-side dependencies from webpack bundling
      config.externals = config.externals || [];
      config.externals.push({
        'puppeteer': 'puppeteer',
        'puppeteer-extra': 'puppeteer-extra',
        'puppeteer-extra-plugin-stealth': 'puppeteer-extra-plugin-stealth',
        'crawlee': 'crawlee',
      });
    }
    return config;
  },
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-extra',
    'puppeteer-extra-plugin-stealth',
    'crawlee',
  ],
};

export default nextConfig;
