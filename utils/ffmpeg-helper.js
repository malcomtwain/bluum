// Version simplifiée de l'utilitaire FFmpeg pour le build statique
// Cette version ne tente pas d'importer les modules natifs

let ffmpegInitialized = false;
let ffmpeg = null;

function initializeFFmpeg() {
  if (ffmpegInitialized) return ffmpeg;

  // Nous sommes dans un environnement de build, retourner null
  if (process.env.NODE_ENV === 'production') {
    console.log('FFmpeg initialization skipped in production build environment');
    ffmpegInitialized = true;
    return null;
  }
  
  // Si nous sommes côté client, ne pas tenter d'initialiser FFmpeg
  if (typeof window !== 'undefined') {
    console.log('FFmpeg non initialisé (environnement client)');
    ffmpegInitialized = true;
    return null;
  }

  // Pour le développement local uniquement, nous pourrions ajouter ici
  // la logique d'initialisation de FFmpeg, mais elle est omise pour
  // ne pas causer de problèmes durant le build

  ffmpegInitialized = true;
  return null;
}

// Fonction stub pour appeler les fonctions Netlify
const callNetlifyFunction = async (operation, options) => {
  if (typeof window === 'undefined') return null; // Seulement côté client
  
  try {
    const response = await fetch('/.netlify/functions/video-processing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation, options }),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de l'appel à la fonction Netlify: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'appel à la fonction Netlify:', error);
    throw error;
  }
};

// Exportation qui ne cause pas d'erreurs
module.exports = {
  get ffmpeg() {
    return initializeFFmpeg();
  },
  initializeFFmpeg,
  callNetlifyFunction
}; 