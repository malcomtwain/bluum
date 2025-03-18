"use client";

import { useState } from 'react';
import { verifyInvitationCode, createAccount } from '../lib/auth';
import { toast } from 'react-hot-toast';

export default function InvitationPage() {
  const [invitationCode, setInvitationCode] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Vérifier le code d'invitation
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationCode.trim()) {
      toast.error('Veuillez entrer un code d\'invitation');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const isValid = await verifyInvitationCode(invitationCode.trim());
      
      if (isValid) {
        setIsVerified(true);
        toast.success('Code valide! Veuillez créer votre compte.');
      } else {
        toast.error('Code d\'invitation invalide ou expiré');
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification du code');
    } finally {
      setIsVerifying(false);
    }
  };

  // Créer un compte
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !email.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    setIsCreatingAccount(true);
    
    try {
      const { user, error } = await createAccount(
        username.trim(),
        email.trim(),
        invitationCode.trim()
      );
      
      if (user && !error) {
        toast.success('Compte créé avec succès!');
        // Rediriger vers la page principale
        window.location.href = '/';
      } else {
        toast.error(error || 'Erreur lors de la création du compte');
      }
    } catch (error) {
      toast.error('Erreur lors de la création du compte');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0c] dark:bg-[#0a0a0c]">
      <div className="w-full max-w-md mx-auto p-6 md:p-8 space-y-6 md:space-y-8 bg-gray-900 rounded-xl shadow-lg border border-gray-800">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Bluum</h1>
          <p className="text-gray-300 text-sm md:text-base">Bienvenue sur notre plateforme de génération vidéo</p>
        </div>
        
        {!isVerified ? (
          // Étape 1: Vérifier le code d'invitation
          <form onSubmit={handleVerifyCode} className="mt-6 md:mt-8 space-y-5">
            <div>
              <label htmlFor="invitation-code" className="block text-sm font-medium text-gray-200 mb-2">
                Code d'invitation
              </label>
              <input
                id="invitation-code"
                type="text"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                placeholder="Entrez votre code d'invitation"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isVerifying || !invitationCode.trim()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? 'Vérification...' : 'Vérifier le code'}
            </button>
          </form>
        ) : (
          // Étape 2: Créer un compte
          <form onSubmit={handleCreateAccount} className="mt-6 md:mt-8 space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choisissez un nom d'utilisateur"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre email"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isCreatingAccount || !username.trim() || !email.trim()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingAccount ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 