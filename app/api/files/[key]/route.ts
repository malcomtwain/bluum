import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

// Définir cette route comme statique pour l'export
export const dynamic = 'force-static';

// Générer des paramètres statiques vides pour l'export
// Définir au moins une valeur de paramètre pour l'export statique
// Cela est nécessaire pour que Next.js considère la route comme valide
export function generateStaticParams() {
  return [
    { key: 'placeholder' }
  ];
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