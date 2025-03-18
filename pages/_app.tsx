import { Toaster } from 'react-hot-toast';
import { SupabaseSync } from '../components/SupabaseSync';
import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

// Désactiver le prérendu statique pour empêcher les erreurs de Clerk
export function getStaticProps() {
  return {
    props: {},
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const [isNetlify, setIsNetlify] = useState(false);

  useEffect(() => {
    // Détection de l'environnement Netlify côté client
    const netlifyDetected = 
      typeof window !== 'undefined' && 
      (window.location.hostname.includes('netlify.app') || 
       process.env.NEXT_PUBLIC_NETLIFY_DEPLOYMENT === 'true');
    
    setIsNetlify(netlifyDetected);
  }, []);

  // Version simplifiée pour Netlify sans Clerk
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('netlify.app') || 
       process.env.NEXT_PUBLIC_NETLIFY_DEPLOYMENT === 'true')) {
    return (
      <>
        <SupabaseSync />
        <Toaster position="bottom-right" />
        <Component {...pageProps} />
      </>
    );
  }

  // Version normale avec Clerk pour les autres environnements
  return (
    <ClerkProvider
      {...pageProps}
      // Désactiver les Server Actions pour éviter l'erreur react-server-dom-webpack
      appearance={{
        baseTheme: "dark"
      }}
      options={{
        loadSerializationLibrary: false,
        // Désactiver le support des actions côté serveur qui cause des erreurs
        supportServerSideActions: false
      }}
    >
      <SupabaseSync />
      <Toaster position="bottom-right" />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp; 