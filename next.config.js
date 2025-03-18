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
  
  // Désactiver temporairement les vérifications strictes pour Clerk Auth
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuration du serveur de développement pour le plugin Netlify
  transpilePackages: ['@clerk/nextjs'],
  
  // Configuration webpack pour exclure les modules natifs
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ne pas inclure ces modules dans le build client
      config.resolve.alias = {
        ...config.resolve.alias,
        '@ffmpeg-installer/ffmpeg': false,
        '@ffprobe-installer/ffprobe': false,
        'fluent-ffmpeg': false,
        'canvas': false,
      };
    }
    
    // Exclure les fichiers README.md, tsconfig.json et les binaires .node
    config.module.rules.push({
      test: /\.(md|node|tsconfig\.json)$/,
      use: 'null-loader',
    });
    
    return config;
  }
};

module.exports = nextConfig; 