import { Toaster } from 'react-hot-toast';
import { SupabaseSync } from '../components/SupabaseSync';
import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';

// Désactiver le prérendu statique pour empêcher les erreurs de Clerk
export function getStaticProps() {
  return {
    props: {},
  }
}

function MyApp({ Component, pageProps }: AppProps) {
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