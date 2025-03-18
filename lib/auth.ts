import { createClient } from '@supabase/supabase-js';

// Initialiser le client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type pour un utilisateur
export type User = {
  id: string;
  email?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
};

// État global d'authentification
let currentUser: User | null = null;
const authListeners: ((user: User | null) => void)[] = [];

// Vérifier un code d'invitation
export async function verifyInvitationCode(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('invitation_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return false;
  }

  // Vérifier que le code n'a pas expiré et n'a pas dépassé le nombre d'utilisations
  const now = new Date();
  if (data.expires_at && new Date(data.expires_at) < now) {
    return false;
  }
  
  if (data.uses_count >= data.uses_allowed) {
    return false;
  }

  return true;
}

// Créer un compte avec un code d'invitation
export async function createAccount(
  username: string, 
  email: string, 
  code: string
): Promise<{ user: User | null; error: string | null }> {
  // Vérifier le code avant de continuer
  const isValid = await verifyInvitationCode(code);
  if (!isValid) {
    return { user: null, error: 'Code d\'invitation invalide ou expiré' };
  }

  // Créer l'utilisateur
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([
      { username, email, invitation_code: code }
    ])
    .select()
    .single();

  if (userError) {
    return { 
      user: null, 
      error: userError.message || 'Erreur lors de la création du compte' 
    };
  }

  // Incrémenter le compteur d'utilisation du code
  await supabase
    .from('invitation_codes')
    .update({ uses_count: supabase.rpc('increment', { row_id: code }) })
    .eq('code', code);

  // Convertir en objet User
  const user: User = {
    id: userData.id,
    email: userData.email,
    username: userData.username,
    fullName: userData.full_name,
    avatarUrl: userData.avatar_url
  };

  // Mettre à jour l'état global
  setCurrentUser(user);
  
  // Stocker l'ID utilisateur dans le localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('bluum_user_id', user.id);
  }

  return { user, error: null };
}

// Se connecter avec nom d'utilisateur
export async function login(username: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) {
    return { user: null, error: 'Utilisateur non trouvé' };
  }

  // Mettre à jour la date de dernière connexion
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', data.id);

  // Convertir en objet User
  const user: User = {
    id: data.id,
    email: data.email,
    username: data.username,
    fullName: data.full_name,
    avatarUrl: data.avatar_url
  };

  // Mettre à jour l'état global
  setCurrentUser(user);
  
  // Stocker l'ID utilisateur dans le localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('bluum_user_id', user.id);
  }

  return { user, error: null };
}

// Se déconnecter
export function logout(): void {
  setCurrentUser(null);
  
  // Supprimer l'ID utilisateur du localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bluum_user_id');
  }
}

// Récupérer l'utilisateur courant
export function getCurrentUser(): User | null {
  return currentUser;
}

// Mettre à jour l'utilisateur courant
function setCurrentUser(user: User | null): void {
  currentUser = user;
  // Notifier tous les listeners
  authListeners.forEach(listener => listener(user));
}

// Ajouter un listener pour les changements d'état d'authentification
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  authListeners.push(callback);
  
  // Appeler le callback immédiatement avec l'état actuel
  callback(currentUser);
  
  // Retourner une fonction pour supprimer le listener
  return () => {
    const index = authListeners.indexOf(callback);
    if (index !== -1) {
      authListeners.splice(index, 1);
    }
  };
}

// Initialiser l'authentification au chargement
export function initAuth(): void {
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('bluum_user_id');
    if (userId) {
      // Récupérer l'utilisateur depuis la base de données
      supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCurrentUser({
              id: data.id,
              email: data.email,
              username: data.username,
              fullName: data.full_name,
              avatarUrl: data.avatar_url
            });
          } else {
            // Si l'utilisateur n'existe plus, se déconnecter
            logout();
          }
        });
    }
  }
} 