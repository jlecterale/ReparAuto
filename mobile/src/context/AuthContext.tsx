import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  appleSignInDisponivel,
  configureGoogleSignIn,
  criarConta,
  deleteAccount,
  loginComApple,
  loginComEmail,
  loginComGoogle,
  logoutFirebase,
  onAuthChange,
} from '@/lib/auth';
import {
  createUserProfile,
  deleteUserProfile,
  getUserProfile,
  updateUserProfile,
} from '@/lib/db';
import type { Usuario, Role, TipoConta } from '@/types';

const DEFAULT_ROLE: Role = 'user';
const DEFAULT_TIPO_CONTA: TipoConta = 'particular';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
if (WEB_CLIENT_ID) configureGoogleSignIn(WEB_CLIENT_ID);

function criarUsuarioBase(fb: FirebaseAuthTypes.User): Usuario {
  return {
    uid: fb.uid,
    nome: fb.displayName || fb.email?.split('@')[0] || 'Utilizador',
    email: fb.email ?? '',
    telefone: '',
    localidade: '',
    codigoPostal: '',
    morada: '',
    nif: '',
    tipoConta: DEFAULT_TIPO_CONTA,
    role: DEFAULT_ROLE,
    bio: '',
    notificacoes: true,
    foto: fb.photoURL ?? null,
    profileCompleted: false,
  };
}

interface AuthContextValue {
  user: Usuario | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  profileCompleted: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  registar: (nome: string, email: string, password: string) => Promise<Usuario>;
  loginGoogle: () => Promise<Usuario>;
  loginApple: () => Promise<Usuario>;
  appleDisponivel: boolean;
  logout: () => Promise<void>;
  eliminarConta: () => Promise<void>;
  updateProfile: (data: Partial<Usuario>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [appleDisponivel, setAppleDisponivel] = useState(false);

  useEffect(() => {
    appleSignInDisponivel().then(setAppleDisponivel).catch(() => {});
  }, []);

  const mergeProfile = useCallback(
    async (fb: FirebaseAuthTypes.User): Promise<Usuario> => {
      const base = criarUsuarioBase(fb);
      try {
        let profile = await getUserProfile(fb.uid);
        if (!profile) {
          await createUserProfile(fb.uid, base as unknown as Record<string, unknown>);
          profile = base;
        }
        return { ...base, ...profile };
      } catch {
        return base;
      }
    },
    [],
  );

  useEffect(() => {
    const unsub = onAuthChange(async (fb) => {
      setUser(fb ? await mergeProfile(fb) : null);
      setLoading(false);
    });
    return unsub;
  }, [mergeProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const fb = await loginComEmail(email, password);
      const merged = await mergeProfile(fb);
      setUser(merged);
      return merged;
    },
    [mergeProfile],
  );

  const registar = useCallback(
    async (nome: string, email: string, password: string) => {
      const fb = await criarConta(email, password, nome);
      const merged = { ...(await mergeProfile(fb)), nome };
      setUser(merged);
      return merged;
    },
    [mergeProfile],
  );

  const loginGoogle = useCallback(async () => {
    const fb = await loginComGoogle();
    const merged = await mergeProfile(fb);
    setUser(merged);
    return merged;
  }, [mergeProfile]);

  const loginApple = useCallback(async () => {
    const fb = await loginComApple();
    const merged = await mergeProfile(fb);
    setUser(merged);
    return merged;
  }, [mergeProfile]);

  const logout = useCallback(async () => {
    await logoutFirebase();
    setUser(null);
  }, []);

  const eliminarConta = useCallback(async () => {
    const uid = user?.uid;
    // Remove the Firestore profile first, then the auth account. If the auth
    // delete needs a recent login, it throws and the caller re-authenticates.
    if (uid) await deleteUserProfile(uid).catch(() => {});
    await deleteAccount();
    setUser(null);
  }, [user?.uid]);

  const updateProfile = useCallback(
    async (data: Partial<Usuario>) => {
      if (!user?.uid) return;
      await updateUserProfile(user.uid, data);
      setUser((prev) => (prev ? { ...prev, ...data } : null));
    },
    [user?.uid],
  );

  const refreshProfile = useCallback(async () => {
    if (!user?.uid) return;
    const profile = await getUserProfile(user.uid);
    if (profile) setUser((prev) => (prev ? { ...prev, ...profile } : null));
  }, [user?.uid]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isLoggedIn: !!user,
      isAdmin: user?.role === 'admin',
      profileCompleted: user?.profileCompleted ?? false,
      login,
      registar,
      loginGoogle,
      loginApple,
      appleDisponivel,
      logout,
      eliminarConta,
      updateProfile,
      refreshProfile,
    }),
    [
      user,
      loading,
      login,
      registar,
      loginGoogle,
      loginApple,
      appleDisponivel,
      logout,
      eliminarConta,
      updateProfile,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
