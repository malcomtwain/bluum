import { Toaster } from 'react-hot-toast';
import { SupabaseSync } from '../components/SupabaseSync';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <SupabaseSync />
      <Toaster position="bottom-right" />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 