"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Après le montage du composant, on peut accéder à l'état d'authentification
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    // On ne redirige que lorsque le composant est monté et que Clerk est chargé
    if (isMounted && isLoaded && !userId) {
      router.push("/auth");
    }
  }, [isMounted, isLoaded, userId, router]);
  
  // Pour l'export statique initial, on affiche directement le contenu
  if (!isMounted) {
    return <>{children}</>;
  }
  
  // Une fois monté et en attente de chargement, on affiche un loader
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
      </div>
    );
  }
  
  // Si l'utilisateur n'est pas authentifié mais que le composant est monté et que
  // Clerk est chargé, on affiche quand même un loader en attendant la redirection
  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
      </div>
    );
  }
  
  return <>{children}</>;
} 