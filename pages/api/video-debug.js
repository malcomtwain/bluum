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
        NETLIFY: process.env.NETLIFY || 'non défini',
        NETLIFY_DEV: process.env.NETLIFY_DEV || 'non défini'
      }
    },
    modules: {
      status: "diagnostic sécurisé"
    },
    networkTest: {
      status: "non testé"
    },
    fileSystem: {
      status: "non testé"
    },
    availablePaths: []
  };

  try {
    // Vérifier si nous sommes côté serveur
    if (typeof window === 'undefined') {
      // Tester l'accès au système de fichiers de manière sécurisée
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Vérifier si certains chemins existent
        const possiblePaths = [
          '/var/task/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg',
          '/opt/build/repo/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg',
          '/opt/build/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg'
        ];
        
        for (const p of possiblePaths) {
          try {
            const exists = fs.existsSync(p);
            diagnostics.availablePaths.push({
              path: p,
              exists
            });
          } catch (e) {
            diagnostics.availablePaths.push({
              path: p,
              error: e.message
            });
          }
        }
        
        diagnostics.fileSystem.status = "testé";
      } catch (fsError) {
        diagnostics.fileSystem = {
          status: "erreur",
          message: fsError.message
        };
      }
      
      // Test réseau
      try {
        diagnostics.networkTest.status = "en cours";
        const testUrl = "https://example.com";
        
        // Utiliser fetch API qui est disponible en Node.js récent
        const response = await fetch(testUrl);
        
        diagnostics.networkTest = {
          status: "testé",
          success: response.ok,
          statusCode: response.status
        };
      } catch (networkError) {
        diagnostics.networkTest = {
          status: "erreur",
          message: networkError.message
        };
      }
      
      // Information sur les modules installés
      try {
        const { existsSync, readFileSync } = require('fs');
        const { join } = require('path');
        
        const packagePath = join(process.cwd(), 'package.json');
        if (existsSync(packagePath)) {
          const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
          diagnostics.modules.dependencies = packageJson.dependencies || {};
          diagnostics.modules.devDependencies = packageJson.devDependencies || {};
        }
      } catch (packageError) {
        diagnostics.modules.error = packageError.message;
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