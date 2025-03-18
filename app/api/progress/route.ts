import { NextRequest, NextResponse } from 'next/server';
import { progress, clients, updateProgressInternal } from '@/lib/progress-store';

// Utiliser dynamic 'auto' au lieu de force-static pour les routes Edge
export const dynamic = 'auto';
// Générer des paramètres pour l'export statique
export function generateStaticParams() {
  return [];
}

// Conserver le runtime edge nécessaire pour les SSE
export const runtime = 'edge';

// Endpoint pour mettre à jour le progrès
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { progress: newProgress } = body;
    
    if (typeof newProgress !== 'number') {
      return NextResponse.json({ error: 'Progress must be a number' }, { status: 400 });
    }
    
    // Utiliser la fonction du store externe
    updateProgressInternal(newProgress);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let streamController: ReadableStreamDefaultController;
  
  try {
    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;
        clients.add(controller);
        
        // Send initial progress with proper SSE format
        const initialData = `data: ${JSON.stringify({ progress })}\n\n`;
        controller.enqueue(encoder.encode(initialData));
        console.log('Initial progress sent:', progress);
      },
      cancel() {
        if (streamController) {
          clients.delete(streamController);
          console.log('Client disconnected, remaining clients:', clients.size);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no' // Disable buffering for Nginx
      },
    });
  } catch (error) {
    console.error('Error in SSE setup:', error);
    return new Response('Error setting up SSE connection', { status: 500 });
  }
} 