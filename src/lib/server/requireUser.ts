import 'server-only';
import { getAdminAuth } from '@/lib/firebase.admin';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

export type RequireUserResult =
  | { user: AuthenticatedUser }
  | { user: null; status: number; error: string };

/**
 * Session guard for API route handlers: verifies the Firebase ID token from
 * the Authorization header. Mirrors firestore.rules — writes require a
 * verified email (isAuthenticated), which callers enforce via emailVerified.
 */
export async function requireUser(request: Request): Promise<RequireUserResult> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return { user: null, status: 401, error: 'unauthorized' };

  const adminAuth = getAdminAuth();
  if (!adminAuth) return { user: null, status: 503, error: 'server_unavailable' };

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email) return { user: null, status: 401, error: 'unauthorized' };
    return {
      user: {
        uid: decoded.uid,
        email: decoded.email,
        emailVerified: decoded.email_verified === true,
      },
    };
  } catch {
    return { user: null, status: 401, error: 'unauthorized' };
  }
}
