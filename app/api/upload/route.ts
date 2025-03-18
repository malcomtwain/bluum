import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

// Importer les helpers pour l'export statique
import { dynamic, generateStaticParams } from '../generateStaticParamsHelper';
// Re-exporter pour cette route
export { dynamic, generateStaticParams };

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // Génération d'une clé unique pour le fichier
    const key = `uploads/${userId}/${uuidv4()}-${file.name}`;
    // Appel correct à uploadFile avec les bons paramètres
    await uploadFile(file, key);
    
    return NextResponse.json({ key });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 