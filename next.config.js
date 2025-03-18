/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  // Forcer le déploiement Edge pour Netlify
  target: process.env.NETLIFY ? 'experimental-serverless-trace' : 'server',
  
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
    // Exclure les modules natifs et les fichiers README/JSON des modules problématiques
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
      
      // Ignorer les modules problématiques dans le bundle client
      config.module.rules.push({
        test: [
          /node_modules\/@ffprobe-installer\/ffprobe\/.*$/,
          /node_modules\/@ffmpeg-installer\/.*$/,
          /node_modules\/canvas\/.*$/,
          /node_modules\/puppeteer\/.*$/,
          /node_modules\/fluent-ffmpeg\/.*$/
        ],
        use: 'ignore-loader',
      });
      
      // Ignorer spécifiquement les fichiers README.md et tsconfig.json
      config.module.rules.push({
        test: [
          /\.md$/,
          /tsconfig\.json$/
        ],
        use: 'ignore-loader',
      });

      // Empêcher webpack d'importer @ffprobe-installer et @ffmpeg-installer
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(@ffprobe-installer\/ffprobe|@ffmpeg-installer\/ffmpeg)$/
        })
      );
    }
    
    return config;
  }
};

module.exports = nextConfig; 