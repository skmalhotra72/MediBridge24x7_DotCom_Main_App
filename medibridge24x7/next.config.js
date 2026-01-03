/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
            { key: 'Pragma', value: 'no-cache' },
          ],
        },
      ];
    },
  };
  
  module.exports = nextConfig;