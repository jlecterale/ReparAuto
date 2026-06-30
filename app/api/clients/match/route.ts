import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase.admin';

export const runtime = 'nodejs';

interface MatchResult {
  matched: boolean;
  uid?: string;
  nome?: string;
  foto?: string | null;
}

/**
 * Looks up whether an email belongs to an existing RecarGarage account, on
 * behalf of a professional managing their CRM.
 *
 * Privacy posture:
 * - Requires a valid Firebase ID token, so this is not an open enumeration API.
 * - Runs server-side with the Admin SDK; the public `users` collection is never
 *   queried by email from the client.
 * - The caller already supplies the email, so no new address is revealed — only
 *   the existence of an account, and only if that user is `discoverableByPros`.
 * - Returns the minimum: the public uid, name and photo (already public).
 * - Degrades to `{ matched: false }` when the Admin SDK is unavailable (e.g.
 *   local dev without ADC).
 */
export async function POST(request: Request): Promise<NextResponse<MatchResult>> {
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) return NextResponse.json({ matched: false });

  // Authenticate the caller.
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return NextResponse.json({ matched: false }, { status: 401 });
  let callerUid = '';
  try {
    callerUid = (await auth.verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ matched: false }, { status: 401 });
  }

  // Only professional accounts may use the CRM match (the feature's audience),
  // which also narrows the membership-lookup surface.
  try {
    const caller = await db.collection('users').doc(callerUid).get();
    if (caller.data()?.tipoConta !== 'profissional') {
      return NextResponse.json({ matched: false }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ matched: false });
  }

  let email = '';
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ matched: false }, { status: 400 });
  }
  if (!email || !email.includes('@')) return NextResponse.json({ matched: false });

  try {
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) return NextResponse.json({ matched: false });
    const data = snap.docs[0].data() as { discoverableByPros?: boolean; nome?: string; foto?: string | null };
    if (data.discoverableByPros === false) return NextResponse.json({ matched: false });
    return NextResponse.json({
      matched: true,
      uid: snap.docs[0].id,
      nome: data.nome || '',
      foto: data.foto ?? null,
    });
  } catch {
    return NextResponse.json({ matched: false });
  }
}
