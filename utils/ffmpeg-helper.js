// Utilitaire pour initialiser FFmpeg de manière robuste
// et gérer les erreurs sans bloquer le rendu

let ffmpegInitialized = false;
let ffmpeg = null;

function initializeFFmpeg() {
  if (ffmpegInitialized) return ffmpeg;
  
  try {
    // Vérifier si l'initialisation est explicitement désactivée pour l'environnement Vercel
    if (process.env.FFMPEG_DISABLE_INITIALIZATION === 'true' || process.env.NEXT_PUBLIC_FFMPEG_ENV === 'vercel') {
      console.log('FFmpeg initialization explicitly disabled for Vercel environment');
      ffmpegInitialized = true;
      return null;
    }
    
    if (typeof window !== 'undefined') {
      // Côté client, ne pas tenter d'initialiser FFmpeg
      console.log('FFmpeg non initialisé (environnement client)');
      ffmpegInitialized = true;
      return null;
    }
    
    const ffmpegPath = process.env.FFMPEG_PATH;
    const ffprobePath = process.env.FFPROBE_PATH;
    
    if (!ffmpegPath || !ffprobePath) {
      console.warn('Chemins FFmpeg ou FFprobe non configurés');
      ffmpegInitialized = true;
      return null;
    }
    
    // Importer les modules uniquement côté serveur
    let ffmpegInstaller, ffprobeInstaller, fluentFFmpeg;
    
    try {
      ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
      ffprobeInstaller = require('@ffprobe-installer/ffprobe');
      fluentFFmpeg = require('fluent-ffmpeg');
    } catch (importError) {
      console.error('Impossible de charger les modules FFmpeg:', importError.message);
      ffmpegInitialized = true;
      return null;
    }
    
    // Utiliser les chemins configurés ou les chemins par défaut de l'installateur
    try {
      fluentFFmpeg.setFfmpegPath(ffmpegPath || ffmpegInstaller.path);
      fluentFFmpeg.setFfprobePath(ffprobePath || ffprobeInstaller.path);
      
      console.log('FFmpeg initialisé avec succès:', {
        ffmpeg: ffmpegPath || ffmpegInstaller.path,
        ffprobe: ffprobePath || ffprobeInstaller.path
      });
      
      ffmpeg = fluentFFmpeg;
    } catch (configError) {
      console.error('Erreur lors de la configuration des chemins FFmpeg:', configError.message);
      ffmpeg = null;
    }
    
    ffmpegInitialized = true;
    return ffmpeg;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation FFmpeg:', error.message);
    ffmpegInitialized = true;
    return null;
  }
}

// Exportation qui gère gracieusement les erreurs
module.exports = {
  get ffmpeg() {
    return initializeFFmpeg();
  },
  initializeFFmpeg
}; 