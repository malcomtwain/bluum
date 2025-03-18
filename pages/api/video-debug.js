// API de diagnostic pour les problèmes de génération vidéo
export default async function handler(req, res) {
  const diagnostics = {
    environment: {
      node: process.version,
      platform: process.platform,
      env: {
        FFMPEG_PATH: process.env.FFMPEG_PATH || 'non défini',
        FFPROBE_PATH: process.env.FFPROBE_PATH || 'non défini',
        NODE_ENV: process.env.NODE_ENV,
        NETLIFY: process.env.NETLIFY || 'non défini'
      }
    },
    ffmpegTest: null,
    modules: null,
    error: null
  };

  try {
    // Vérifier si nous sommes côté serveur
    if (typeof window === 'undefined') {
      // Essayer de charger les modules FFmpeg de façon sécurisée
      try {
        const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg');
        const ffprobeInstaller = await import('@ffprobe-installer/ffprobe');
        
        diagnostics.modules = {
          ffmpegInstaller: ffmpegInstaller ? 'chargé' : 'non chargé',
          ffprobeInstaller: ffprobeInstaller ? 'chargé' : 'non chargé'
        };
        
        diagnostics.ffmpegTest = {
          ffmpegPath: ffmpegInstaller.path,
          ffprobePath: ffprobeInstaller.path
        };
        
        // Essayer de charger fluent-ffmpeg
        try {
          const fluentFFmpeg = await import('fluent-ffmpeg');
          diagnostics.modules.fluentFFmpeg = 'chargé';
        } catch (e) {
          diagnostics.modules.fluentFFmpeg = `erreur: ${e.message}`;
        }
      } catch (error) {
        diagnostics.error = {
          message: error.message,
          stack: error.stack
        };
      }
    } else {
      diagnostics.error = "Cette API doit être appelée côté serveur";
    }
  } catch (error) {
    diagnostics.error = {
      message: error.message,
      stack: error.stack
    };
  }

  res.status(200).json(diagnostics);
} 