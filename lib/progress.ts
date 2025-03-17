/**
 * Cette fonction envoie une mise à jour de progression au serveur
 * en utilisant l'API POST /api/progress
 */
export async function updateProgress(newProgress: number) {
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progress: newProgress }),
    });
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
} 