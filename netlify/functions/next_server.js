const { builder } = require('@netlify/functions');
const { createRequestHandler } = require('next-on-netlify');

// Créer le handler pour les requêtes Next.js
const nextHandler = createRequestHandler({
  // La fonction va chercher les fichiers dans `.next`
  distDir: '.next',
});

// Exporter le handler sous forme de fonction Netlify
exports.handler = builder(nextHandler); 