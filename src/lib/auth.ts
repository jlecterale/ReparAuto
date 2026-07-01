import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export async function loginComEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function criarConta(email: string, password: string, nome: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (nome) {
    await updateProfile(result.user, { displayName: nome });
  }
  await sendEmailVerification(result.user);
  return result.user;
}

export async function enviarVerificacaoEmail(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function loginComGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function enviarEmailReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
