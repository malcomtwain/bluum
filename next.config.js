/** @type {import('next').NextConfig} */
const path = require('path');

// Définir l'environnement pour désactiver les Server Actions
process.env.NEXT_DISABLE_SERVER_ACTIONS = '1';

const nextConfig = {
  async headers() {
    return [
      /*
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' }
        ],
      },
      */
    ];
  },
  // Configuration pour l'export statique simple
  output: 'export',
  // Activer les slash de fin pour les chemins
  trailingSlash: true,
  // Répertoire de build
  distDir: '.next',
  // Ignorer les erreurs de build pour les routes API puisqu'elles seront gérées par Netlify
  onDemandEntries: {
    // Augmenter la durée de conservation en cache pour les pages
    maxInactiveAge: 25 * 1000,
    // Augmenter le nombre maximum de pages en cache
    pagesBufferLength: 5,
  },
  
  webpack: (config, { isServer }) => {
    // Configuration spécifique au client
    if (!isServer) {
      // Ignorer les modules node côté client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        'canvas': false,
        '@ffmpeg-installer/ffmpeg': false,
        '@ffprobe-installer/ffprobe': false,
        'fluent-ffmpeg': false,
        'puppeteer': false,
      };
    } else {
      // Externaliser les dépendances lourdes côté serveur
      config.externals = [...(config.externals || []), 
        '@ffmpeg-installer/ffmpeg', 
        '@ffprobe-installer/ffprobe', 
        'fluent-ffmpeg', 
        'puppeteer',
        'canvas'
      ];
    }

    // Traiter les modules problématiques
    config.module.rules.push({
      test: /[\\/](canvas|@ffmpeg-installer|@ffprobe-installer|fluent-ffmpeg|puppeteer)[\\/].*$/,
      loader: 'null-loader',
      type: 'javascript/auto'
    });

    return config;
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