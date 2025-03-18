import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, getCurrentUser, onAuthStateChanged, initAuth, logout } from '../lib/auth';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialiser l'authentification
    initAuth();

    // S'abonner aux changements d'état d'authentification
    const unsubscribe = onAuthStateChanged((newUser) => {
      setUser(newUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 