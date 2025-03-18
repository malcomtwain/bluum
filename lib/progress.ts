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

// Fonction simple pour gérer le progrès de génération vidéo
// Compatible avec tous les environnements (local et Netlify)

// État global pour le progrès actuel (0-100)
let currentProgress = 0;
let progressCallbacks: ((progress: number) => void)[] = [];

/**
 * Met à jour la progression de génération de vidéo (0-100)
 */
export function updateProgress(progress: number): void {
  currentProgress = Math.min(100, Math.max(0, progress));
  // Notifier tous les callbacks enregistrés
  progressCallbacks.forEach(callback => {
    try {
      callback(currentProgress);
    } catch (error) {
      console.error('Erreur dans le callback de progression:', error);
    }
  });
}

/**
 * Récupère la progression actuelle
 */
export function getProgress(): number {
  return currentProgress;
}

/**
 * S'abonne aux mises à jour de progression
 */
export function subscribeToProgress(callback: (progress: number) => void): () => void {
  progressCallbacks.push(callback);
  
  // Retourne une fonction pour se désabonner
  return () => {
    progressCallbacks = progressCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Réinitialise la progression à 0
 */
export function resetProgress(): void {
  currentProgress = 0;
  progressCallbacks.forEach(callback => {
    try {
      callback(0);
    } catch (error) {
      console.error('Erreur dans le callback de réinitialisation:', error);
    }
  });
} 