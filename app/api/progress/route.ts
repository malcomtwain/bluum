import { NextResponse } from 'next/server';

// Exportons ces variables pour les partager entre les fichiers
export let progress = 0;
export let clients = new Set<ReadableStreamDefaultController>();

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Endpoint pour mettre à jour le progrès
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { progress: newProgress } = body;
    
    if (typeof newProgress !== 'number') {
      return NextResponse.json({ error: 'Progress must be a number' }, { status: 400 });
    }
    
    // Mettre à jour directement la variable progress
    progress = newProgress;
    
    // Envoyer la mise à jour à tous les clients connectés
    const data = `data: ${JSON.stringify({ progress })}\n\n`;
    const encoder = new TextEncoder();
    console.log('Sending progress update to', clients.size, 'clients:', newProgress);
    
    const deadClients = new Set<ReadableStreamDefaultController>();
    
    clients.forEach(client => {
      try {
        client.enqueue(encoder.encode(data));
      } catch (error) {
        console.error('Error sending progress update:', error);
        deadClients.add(client);
      }
    });
    
    // Clean up dead clients
    deadClients.forEach(client => {
      clients.delete(client);
    });
    
    console.log('Progress update complete, remaining clients:', clients.size);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
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