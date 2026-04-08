/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['leaflet', 'react-leaflet'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // PWA 支援
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
      ],
    },
  ],
  // Workbox runtime caching – CacheFirst for static data JSON files (30 days)
  // Workbox 運行時快取 – 對 /data/*.json 使用 CacheFirst（30 天）
  pwa: {
    dest: 'public',
    runtimeCaching: [
      {
        urlPattern: /\/data\/.*\.json$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-data-cache',
          expiration: {
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
          },
        },
      },
      {
        urlPattern: /https?:\/\/[a-z]*\.tile\.openstreetmap\.org\/.*\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'osm-tiles-cache',
          expiration: {
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            maxEntries: 500,
          },
        },
      },
    ],
  },
};

module.exports = nextConfig;
