import 'server-only';
import { getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'reparauto-site';

let adminApp: App | null = null;

function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }
  try {
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
    return adminApp;
  } catch {
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch {
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return getAuth(app);
  } catch {
    return null;
  }
}

export const ADMIN_PROJECT_ID = PROJECT_ID;
