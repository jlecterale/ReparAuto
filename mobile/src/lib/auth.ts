/**
 * Auth helpers — mirror the web app's `src/lib/auth.ts` surface, adapted for
 * native (no popup; Google Sign-In uses the native SDK + a Firebase credential).
 */
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import authModule, {
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { auth } from './firebase';

type User = FirebaseAuthTypes.User;

/**
 * Configure Google Sign-In once at app start. `webClientId` must be the
 * OAuth client of type 3 (web) so the returned idToken is accepted by Firebase.
 */
export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
}

export async function loginComEmail(
  email: string,
  password: string,
): Promise<User> {
  const result = await auth.signInWithEmailAndPassword(email, password);
  return result.user;
}

export async function criarConta(
  email: string,
  password: string,
  nome: string,
): Promise<User> {
  const result = await auth.createUserWithEmailAndPassword(email, password);
  if (nome) {
    await result.user.updateProfile({ displayName: nome });
  }
  return result.user;
}

export async function loginComGoogle(): Promise<User> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  // google-signin v13+ returns { type, data }; older returns the user directly.
  const idToken =
    // @ts-expect-error — support both response shapes across versions.
    response?.data?.idToken ?? response?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In não devolveu um idToken.');
  }
  const credential = authModule.GoogleAuthProvider.credential(idToken);
  const result = await auth.signInWithCredential(credential);
  return result.user;
}

/** True only on iOS 13+ where Sign in with Apple is available. */
export async function appleSignInDisponivel(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

/**
 * Sign in with Apple — required by App Store Guideline 4.8 whenever the app
 * also offers a third-party login (Google).
 */
export async function loginComApple(): Promise<User> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error('Apple Sign-In não devolveu um identityToken.');
  }
  const { identityToken, fullName } = credential;
  const appleCredential = authModule.AppleAuthProvider.credential(identityToken);
  const result = await auth.signInWithCredential(appleCredential);
  // Apple only returns the name on first sign-in — persist it once.
  const nome = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ');
  if (nome && !result.user.displayName) {
    await result.user.updateProfile({ displayName: nome });
  }
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // not signed in with Google — ignore.
  }
  await auth.signOut();
}

export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  return auth.onAuthStateChanged(callback);
}

/** Error code thrown by Firebase when a sensitive op needs a fresh login. */
export const REQUIRES_RECENT_LOGIN = 'auth/requires-recent-login';

/**
 * Deletes the current Firebase Auth user. Required for App Store approval
 * (Guideline 5.1.1(v) — in-app account deletion). Firestore profile cleanup is
 * handled by the caller. May throw `auth/requires-recent-login`.
 */
export async function deleteAccount(): Promise<void> {
  const current = auth.currentUser;
  if (!current) throw new Error('Nenhum utilizador autenticado.');
  await current.delete();
}

export async function enviarEmailReset(email: string): Promise<void> {
  await auth.sendPasswordResetEmail(email);
}

export { statusCodes };
