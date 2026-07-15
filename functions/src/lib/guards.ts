import { type CallableRequest, HttpsError } from "firebase-functions/v2/https";

/**
 * All AI callables require a signed-in user with a verified email — same bar
 * as creating a listing in firestore.rules.
 *
 * App Check note (§2.1): callables are declared with `enforceAppCheck: false`
 * for the gradual rollout. Register the providers (Play Integrity / App
 * Attest / reCAPTCHA Enterprise), monitor the verified % in the console, and
 * flip enforcement on per function only once >95% of traffic is verified.
 */
export function requireVerifiedUser(request: CallableRequest): string {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  if (request.auth.token.email_verified !== true) {
    throw new HttpsError("unauthenticated", "Verified email required.");
  }
  return request.auth.uid;
}
