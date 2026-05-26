import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  loginComEmail,
  criarConta,
  loginComGoogle,
  logoutFirebase,
  onAuthChange,
} from '@/lib/auth';
import type { Usuario } from '@/types/usuario';

export default function useAuth() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilizador',
          email: firebaseUser.email!,
          foto: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<Usuario> => {
    const fbUser = await loginComEmail(email, password);
    return {
      uid: fbUser.uid,
      nome: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilizador',
      email: fbUser.email!,
      foto: fbUser.photoURL,
    };
  }, []);

  const registar = useCallback(async (nome: string, email: string, password: string): Promise<Usuario> => {
    const fbUser = await criarConta(email, password, nome);
    return {
      uid: fbUser.uid,
      nome: fbUser.displayName || nome,
      email: fbUser.email!,
      foto: fbUser.photoURL,
    };
  }, []);

  const loginGoogle = useCallback(async (): Promise<Usuario> => {
    const fbUser = await loginComGoogle();
    return {
      uid: fbUser.uid,
      nome: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilizador',
      email: fbUser.email!,
      foto: fbUser.photoURL,
    };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await logoutFirebase();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    registar,
    loginGoogle,
    logout,
    isLoggedIn: !!user,
  };
}
