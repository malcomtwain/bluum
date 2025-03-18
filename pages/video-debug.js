import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function VideoDebug() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [alternativeTest, setAlternativeTest] = useState(null);
  const [loading, setLoading] = useState({ diagnostics: false, alternative: false });
  const [error, setError] = useState(null);

  const runDiagnostics = async () => {
    setLoading(prev => ({ ...prev, diagnostics: true }));
    setError(null);
    try {
      const response = await fetch('/api/video-debug');
      const data = await response.json();
      setDiagnostics(data);
    } catch (err) {
      setError(`Erreur de diagnostic: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, diagnostics: false }));
    }
  };

  const testAlternative = async () => {
    setLoading(prev => ({ ...prev, alternative: true }));
    setError(null);
    try {
      const response = await fetch('/api/alternative-video');
      const data = await response.json();
      setAlternativeTest(data);
    } catch (err) {
      setError(`Erreur alternative: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, alternative: false }));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Débogage Vidéo</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">Page de débogage pour la génération vidéo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Diagnostics FFmpeg</h2>
          <button 
            onClick={runDiagnostics}
            disabled={loading.diagnostics}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
          >
            {loading.diagnostics ? 'Chargement...' : 'Exécuter les diagnostics'}
          </button>
          
          {diagnostics && (
            <div className="mt-4">
              <h3 className="font-semibold">Résultats:</h3>
              <pre className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">API Alternative (Test)</h2>
          <button 
            onClick={testAlternative}
            disabled={loading.alternative}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
          >
            {loading.alternative ? 'Chargement...' : 'Tester l\'API alternative'}
          </button>
          
          {alternativeTest && (
            <div className="mt-4">
              <h3 className="font-semibold">Résultats:</h3>
              <pre className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
                {JSON.stringify(alternativeTest, null, 2)}
              </pre>
              
              {alternativeTest.videoUrl && (
                <div className="mt-4">
                  <h4 className="font-semibold">Aperçu de la vidéo:</h4>
                  <video 
                    controls 
                    className="mt-2 max-w-full" 
                    src={alternativeTest.videoUrl}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p><strong>Note:</strong> Cette page est uniquement destinée au débogage et ne modifie pas votre code de génération vidéo principal.</p>
        <p>Une fois le problème identifié, nous pourrons résoudre les erreurs sans modifier la logique que vous avez développée pendant 3 mois.</p>
      </div>
    </div>
  );
} 