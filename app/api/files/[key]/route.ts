import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

// Définir cette route comme statique pour l'export
export const dynamic = 'force-static';

// Générer des paramètres statiques vides pour l'export
export function generateStaticParams() {
  // Cette fonction est nécessaire pour l'export statique
  // mais les routes API seront en réalité gérées par les fonctions Netlify
  return [];
}

export async function GET(
  request: NextRequest,
  context: { params: { key: string } }
) {
  try {
    const fileUrl = getFileUrl(context.params.key);
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get file URL' },
      { status: 500 }
    );
  }
} 