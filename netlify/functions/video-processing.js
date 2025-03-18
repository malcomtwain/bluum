const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const fluentFFmpeg = require('fluent-ffmpeg');
const { createReadStream, createWriteStream } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');
const { promisify } = require('util');
const { writeFile, readFile, unlink } = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Initialisation de FFmpeg - avec vérification pour éviter les erreurs
try {
  // Définir les chemins de FFmpeg et FFprobe
  const ffmpegPath = process.env.FFMPEG_PATH || ffmpegInstaller.path;
  const ffprobePath = process.env.FFPROBE_PATH || ffprobeInstaller.path;
  
  console.log('Chemins FFmpeg détectés:', { ffmpeg: ffmpegPath, ffprobe: ffprobePath });
  
  // Configurer FFmpeg
  fluentFFmpeg.setFfmpegPath(ffmpegPath);
  fluentFFmpeg.setFfprobePath(ffprobePath);
  
  console.log('FFmpeg initialisé avec succès dans la fonction Netlify');
} catch (error) {
  console.error('Erreur lors de l\'initialisation de FFmpeg:', error.message);
  // Ne pas planter la fonction en cas d'erreur d'initialisation
}

// Handler principal pour la fonction Netlify
exports.handler = async function(event, context) {
  // Vérifier la méthode
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parser le corps de la requête
    const body = JSON.parse(event.body);
    const { operation, options } = body;

    // Vérifier l'opération demandée
    switch (operation) {
      case 'generateVideo':
        return await handleGenerateVideo(options);
      case 'generateHookPreview':
        return await handleGenerateHookPreview(options);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Opération non supportée' })
        };
    }
  } catch (error) {
    console.error('Erreur dans la fonction de traitement vidéo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur de traitement vidéo', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

// Fonction pour générer une vidéo
async function handleGenerateVideo(options) {
  // Créer un ID unique pour cette opération
  const operationId = uuidv4();
  const tempDir = join(tmpdir(), `video-${operationId}`);
  
  // Télécharger les fichiers d'entrée (template, média, musique)
  // Exécuter FFmpeg pour générer la vidéo
  // Retourner l'URL de la vidéo générée ou un blob base64
  
  // Pour l'instant, retournons une réponse simulée pour le test
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Fonction de génération vidéo prête à être implémentée',
      operationId
    })
  };
}

// Fonction pour générer une prévisualisation de hook
async function handleGenerateHookPreview(options) {
  const { text, style } = options;
  const operationId = uuidv4();

  // Pour l'instant, retournons une réponse simulée pour le test
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Fonction de prévisualisation de hook prête à être implémentée',
      operationId,
      text,
      style
    })
  };
} 