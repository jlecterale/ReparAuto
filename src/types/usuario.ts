import type { User } from 'firebase/auth';

export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  foto: string | null;
}

export type FirebaseUser = User;

export interface AuthContextValue {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  registar: (nome: string, email: string, password: string) => Promise<Usuario>;
  loginGoogle: () => Promise<Usuario>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
}
