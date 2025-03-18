/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour le déploiement Netlify
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' }
        ],
      },
    ];
  },

  // Optimisation des images
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com', 'localhost'],
  },
  
  // Configuration expérimentale minimale
  experimental: {
    largePageDataBytes: 128 * 1000000, // 128 MB
  },
};

module.exports = nextConfig; 