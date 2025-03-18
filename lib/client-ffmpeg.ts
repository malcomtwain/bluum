/**
 * Module de génération vidéo côté client pour Netlify
 * Utilise FFmpeg.wasm comme alternative à FFmpeg côté serveur
 */

// Cette approche sera utilisée uniquement dans les environnements où FFmpeg n'est pas disponible côté serveur
// comme sur Netlify qui n'autorise pas l'exécution de binaires natifs

let FFmpeg: any = null;
let loaded = false;

// Charge et initialise FFmpeg.wasm de manière asynchrone
async function loadFFmpeg() {
  if (loaded) return FFmpeg;
  
  try {
    const { FFmpeg: FFmpegClass } = await import('@ffmpeg/ffmpeg');
    const { fetchFile } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/ffmpeg');
    
    FFmpeg = new FFmpegClass();
    
    // Charger les fichiers core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
    await FFmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    loaded = true;
    console.log('FFmpeg WASM chargé avec succès');
    return { FFmpeg, fetchFile };
  } catch (error) {
    console.error('Erreur lors du chargement de FFmpeg WASM:', error);
    throw error;
  }
}

// Génère une vidéo côté client
export async function generateClientVideo(options: {
  template: File | Blob;
  video: File | Blob;
  music?: File | Blob;
  hook?: {
    text: string;
    style: any;
  };
  onProgress?: (progress: number) => void;
}) {
  try {
    const { FFmpeg, fetchFile } = await loadFFmpeg();
    const { template, video, music, hook, onProgress } = options;
    
    // Mise à jour du progrès
    if (onProgress) onProgress(10);
    
    // Écrire les fichiers en mémoire
    await FFmpeg.writeFile('template.mp4', await fetchFile(template));
    await FFmpeg.writeFile('video.mp4', await fetchFile(video));
    if (music) {
      await FFmpeg.writeFile('music.mp3', await fetchFile(music));
    }
    
    // Mise à jour du progrès
    if (onProgress) onProgress(30);
    
    // Exécuter la commande FFmpeg pour concaténer les vidéos
    let command = `-i template.mp4 -i video.mp4`;
    
    if (music) {
      command += ` -i music.mp3`;
    }
    
    // Configurer la sortie
    command += ` -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[outv]" -map "[outv]"`;
    
    if (music) {
      command += ` -map 2:a`;
    }
    
    command += ` -c:v h264 -pix_fmt yuv420p -preset ultrafast -crf 28 output.mp4`;
    
    // Exécuter la commande
    await FFmpeg.exec(command.split(' '));
    
    // Mise à jour du progrès
    if (onProgress) onProgress(80);
    
    // Lire le fichier résultant
    const data = await FFmpeg.readFile('output.mp4');
    
    // Créer un Blob à partir des données
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    
    // Mise à jour du progrès
    if (onProgress) onProgress(100);
    
    return {
      blob,
      url,
      demo: true
    };
  } catch (error) {
    console.error('Erreur lors de la génération côté client:', error);
    throw error;
  }
}

// Vérifie si FFmpeg.wasm est disponible dans cet environnement
export async function isFFmpegWasmSupported(): Promise<boolean> {
  try {
    // Vérifier si nous sommes dans un navigateur
    if (typeof window === 'undefined') return false;
    
    // Vérifier si SharedArrayBuffer est disponible (requis pour FFmpeg.wasm)
    if (typeof SharedArrayBuffer === 'undefined') {
      console.warn('SharedArrayBuffer n\'est pas disponible, FFmpeg.wasm ne fonctionnera pas');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de la compatibilité FFmpeg.wasm:', error);
    return false;
  }
} 