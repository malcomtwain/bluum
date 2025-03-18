"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { SignIn, SignUp } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

// Pour permettre l'export statique avec les routes dynamiques
export const dynamic = 'force-static';

// Générer les paramètres statiques pour les routes d'authentification
export function generateStaticParams() {
  return [
    { auth: ['sign-in'] },
    { auth: ['sign-up'] }
  ];
}

export default function AuthPage() {
  const pathname = usePathname();
  const isSignUp = pathname?.includes("/sign-up");

  // Récupérer la clé publique de Clerk depuis l'environnement
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        {isSignUp ? <SignUp /> : <SignIn />}
      </div>
    </div>
  );
} 