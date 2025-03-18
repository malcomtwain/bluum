import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// Imports conditionnels pour les modules natifs
let pathModule: any = null;
let fsPromises: any = null;
let osModule: any = null;
let ffprobeModule: any = null;
let childProcess: any = null;

// Ne charger les modules que côté serveur
if (typeof window === 'undefined') {
  try {
    // Charger les modules natifs de manière conditionnelle
    pathModule = require('path');
    fsPromises = require('fs/promises');
    osModule = require('os');
    childProcess = require('child_process');
    
    // Essayer de charger ffprobe seulement côté serveur
    try {
      ffprobeModule = require('@ffprobe-installer/ffprobe');
    } catch (e) {
      console.warn('Module ffprobe non disponible:', e);
    }
  } catch (e) {
    console.warn('Modules natifs non disponibles pendant la compilation', e);
  }
}

// Configuration pour l'environnement Edge
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Forcer l'utilisation du runtime Node.js

// Générer des paramètres statiques vides pour l'export
export function generateStaticParams() {
  return [];
}

export function GET() {
  return NextResponse.json({
    message: "Cette route sera gérée par Netlify Functions en production"
  });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Si les modules ne sont pas disponibles (environnement de compilation), retourner une réponse stub
    if (!pathModule || !fsPromises || !osModule || !childProcess) {
      console.warn('Modules natifs requis non disponibles - environnement de compilation');
      return NextResponse.json({
        success: false,
        message: 'Cette fonction requiert des modules Node.js qui ne sont disponibles qu'à l'exécution',
        duration: 0,
        fileName: "example.mp3",
        fileSize: 0
      });
    }

    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Créer un répertoire temporaire pour stocker le fichier
    const tempDir = await fsPromises.mkdtemp(pathModule.join(osModule.tmpdir(), 'audio-analyze-'));
    const filePath = pathModule.join(tempDir, audioFile.name);
    
    // Écrire le fichier sur le disque
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    await fsPromises.writeFile(filePath, buffer);
    
    // Analyser le fichier avec ffprobe
    const ffprobePath = process.env.FFPROBE_PATH || (ffprobeModule ? ffprobeModule.path : '');
    const { execSync } = childProcess;
    
    // Commande pour extraire les métadonnées
    const cmd = `"${ffprobePath}" -v error -show_entries format=duration -of json "${filePath}"`;
    
    try {
      const output = execSync(cmd).toString();
      const data = JSON.parse(output);
      const duration = parseFloat(data.format.duration);
      
      // Nettoyer le fichier temporaire
      await fsPromises.unlink(filePath);
      await fsPromises.rmdir(tempDir);
      
      return NextResponse.json({ 
        success: true, 
        duration: duration,
        fileName: audioFile.name,
        fileSize: audioFile.size
      });
    } catch (error: any) {
      console.error('FFprobe error:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to analyze audio: ${error.message}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error analyzing audio:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error: ${error.message}` 
    }, { status: 500 });
  }
} 