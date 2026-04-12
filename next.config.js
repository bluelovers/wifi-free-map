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
  // allowedDevOrigins: ['192.168.0.66'],
};

export default nextConfig;
