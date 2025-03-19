/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  
  // Configuration pour le déploiement Netlify
  distDir: '.next',
  
  // Suppression des props inutilisées (réduit la taille des bundles)
  swcMinify: true,
  
  // Configuration pour le déploiement Netlify
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // Désactiver l'optimisation des images pour permettre l'export statique
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com', 'localhost', 'cdn.bluum.app', 'bluum-uploads.s3.amazonaws.com'],
  },
  
  // Configuration expérimentale minimale
  experimental: {
    largePageDataBytes: 512 * 1000, // Augmenter limite pour les données de page
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
  webpack: (config, { isServer, dev }) => {
    // Ajouter la résolution des alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
    };
    
    // Sur Netlify en production, remplacer Clerk par notre mock
    const isNetlify = process.env.NETLIFY === 'true' || process.env.NEXT_PUBLIC_NETLIFY_DEPLOYMENT === 'true';
    
    if (isNetlify && !dev) {
      console.log('📣 Netlify détecté: Utilisation du mock d\'authentification');
      config.resolve.alias['@clerk/nextjs'] = path.join(__dirname, 'lib/auth-mock.ts');
      config.resolve.alias['@clerk/clerk-react'] = path.join(__dirname, 'lib/auth-mock.ts');
    }
    
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
        crypto: false,
        stream: false,
        '@ffmpeg/ffmpeg': false,
        '@ffmpeg/util': false,
      };
    }

    // Résoudre l'erreur de 'self is not defined' pour les modules web
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Personnaliser le comportement de webpack pour les workers
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: {
        loader: 'worker-loader',
        options: {
          filename: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      },
    });

    return config;
  },

  // Variables d'environnement disponibles côté client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_FFMPEG_ENV: process.env.NEXT_PUBLIC_FFMPEG_ENV || 'local',
    NEXT_PUBLIC_NETLIFY_DEPLOYMENT: 'true',
    NETLIFY_USE_FFMPEG: 'true',
  },
};

// Export du module configuré
module.exports = nextConfig; 