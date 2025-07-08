'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/config';
import { UserData, getCurrentUserData } from '@/lib/auth/auth-service';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isLoading: true,
  session: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener la sesión actual al cargar
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (currentSession?.user) {
          const userProfile = await getCurrentUserData();
          setUserData(userProfile);
        }
      } catch (error) {
        console.error('Erro obtendo sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (newSession?.user) {
          const userProfile = await getCurrentUserData();
          setUserData(userProfile);
        } else {
          setUserData(null);
        }
        
        setIsLoading(false);
      }
    );

    // Limpiar suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, isLoading, session }}>
      {children}
    </AuthContext.Provider>
  );
};
