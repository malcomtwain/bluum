import { Toaster } from 'react-hot-toast';
import { SupabaseSync } from '../components/SupabaseSync';
import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';
import '../styles/globals.css';

// Désactiver le prérendu statique pour empêcher les erreurs de Clerk
export function getStaticProps() {
  return {
    props: {},
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <SupabaseSync />
      <Toaster position="bottom-right" />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp; 