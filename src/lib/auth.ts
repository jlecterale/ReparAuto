import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyPasswordResetCode,
  confirmPasswordReset,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

// Bring the user back to our own domain after they confirm their email, so the
// link in the message points at recargarage.com instead of the default
// firebaseapp.com handler. A branded continue URL both looks less like phishing
// (helping deliverability) and keeps the post-verification landing on-brand.
const verificationSettings = {
  url: `${SITE_URL}/perfil`,
  handleCodeInApp: false,
};

export async function loginComEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function criarConta(email: string, password: string, nome: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (nome) {
    await updateProfile(result.user, { displayName: nome });
  }
  await sendEmailVerification(result.user, verificationSettings);
  return result.user;
}

export async function enviarVerificacaoEmail(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser, verificationSettings);
  }
}

export async function loginComGoogle(): Promise<{ user: User; isNewUser: boolean }> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return { user: result.user, isNewUser: getAdditionalUserInfo(result)?.isNewUser ?? false };
}

export async function loginComApple(): Promise<User> {
  // Same Firebase project as the iOS app, so an account created via Sign in
  // with Apple on the iPhone resolves to the same UID here (no relinking).
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
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

/** Validates a password-reset oobCode and returns the account's email. */
export async function verifyResetCode(code: string): Promise<string> {
  return verifyPasswordResetCode(auth, code);
}

export async function confirmNewPassword(code: string, newPassword: string): Promise<void> {
  await confirmPasswordReset(auth, code, newPassword);
}
