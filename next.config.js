/** @type {import('next').NextConfig} */
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
  // Configuration pour l'export statique
  output: 'export',
  // Désactiver les routes dynamiques pour l'export statique
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    // Configuration spécifique au client
    if (!isServer) {
      // Complètement ignorer les modules FFmpeg et node-only côté client
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
      // Configuration côté serveur - exclure les dépendances FFmpeg des bundles principaux
      config.externals = [...(config.externals || []), 
        '@ffmpeg-installer/ffmpeg', 
        '@ffprobe-installer/ffprobe', 
        'fluent-ffmpeg', 
        'puppeteer',
        'canvas'
      ];
    }

    // Gérer tous les fichiers liés à FFmpeg/FFprobe et Canvas
    config.module.rules.push({
      test: /[\\/](canvas|@ffmpeg-installer|@ffprobe-installer|fluent-ffmpeg|puppeteer)[\\/].*$/,
      loader: 'null-loader',
      type: 'javascript/auto'
    });

    return config;
  },
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com', 'localhost'],
  },
  // Augmenter la taille maximale de la page
  experimental: {
    largePageDataBytes: 128 * 1000000, // 128 MB
  },
};

module.exports = nextConfig; 