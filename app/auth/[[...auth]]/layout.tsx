import React from 'react';

// Générer des paramètres statiques pour l'export
export function generateStaticParams() {
  return [
    { auth: ['sign-in'] },
    { auth: ['sign-up'] }
  ];
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
