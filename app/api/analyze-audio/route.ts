import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// Définir cette route comme statique pour l'export
export const dynamic = 'force-static';

// Générer des paramètres statiques vides pour l'export
export function generateStaticParams() {
  return [];
}

export async function POST(request: NextRequest) {
  // Pour l'export statique, retourner une réponse indiquant que cette route sera gérée par Netlify Functions
  if (process.env.NETLIFY_DEPLOYMENT === 'true' || process.env.NEXT_PUBLIC_NETLIFY_DEPLOYMENT === 'true') {
    return NextResponse.json({
      message: "Cette route sera gérée par Netlify Functions en production"
    });
  }

  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Importer les modules uniquement côté serveur
    const path = await import('path');
    const fs = await import('fs/promises');
    const os = await import('os');

    // Créer un répertoire temporaire pour stocker le fichier
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-analyze-'));
    const filePath = path.join(tempDir, audioFile.name);
    
    // Écrire le fichier sur le disque
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    
    // Analyser le fichier avec ffprobe - utilisation dynamique pour éviter les problèmes de build
    let ffprobePath;
    let execSync;
    
    try {
      ffprobePath = process.env.FFPROBE_PATH;
      if (!ffprobePath) {
        const ffprobeInstaller = await import('@ffprobe-installer/ffprobe');
        ffprobePath = ffprobeInstaller.path;
      }
      
      const childProcess = await import('child_process');
      execSync = childProcess.execSync;
    } catch (error) {
      console.error('Error loading ffprobe:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'FFprobe not available in this environment' 
      }, { status: 500 });
    }
    
    // Commande pour extraire les métadonnées
    const cmd = `"${ffprobePath}" -v error -show_entries format=duration -of json "${filePath}"`;
    
    try {
      const output = execSync(cmd).toString();
      const data = JSON.parse(output);
      const duration = parseFloat(data.format.duration);
      
      // Nettoyer le fichier temporaire
      await fs.unlink(filePath);
      await fs.rmdir(tempDir);
      
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