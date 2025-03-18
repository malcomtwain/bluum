/** @type {import('next').NextConfig} */
const path = require('path');

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
    instrumentationHook: false,
  },
  
  // Désactiver temporairement les vérifications strictes
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Résolution des chemins
  transpilePackages: ['@clerk/nextjs'],
  
  // Configuration webpack avec résolution des alias
  webpack: (config, { isServer }) => {
    // Ajouter la résolution des alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
    };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
        net: false,
        tls: false,
        canvas: false,
      };
    }
    return config;
  }
};

module.exports = nextConfig; 