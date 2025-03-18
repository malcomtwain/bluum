"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import InvitationPage from './InvitationPage';

interface AuthLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthLayout({ 
  children, 
  requireAuth = true 
}: AuthLayoutProps) {
  const { user, isLoading } = useAuth();

  // Si la page est en cours de chargement
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  // Si l'authentification est requise et que l'utilisateur n'est pas connecté
  if (requireAuth && !user) {
    return <InvitationPage />;
  }

  // Si l'utilisateur est connecté ou si l'authentification n'est pas requise
  return <>{children}</>;
}