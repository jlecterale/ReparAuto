import 'server-only';
import { NextResponse } from 'next/server';

/**
 * Last-resort error response for API route handlers. Credential/permission
 * failures (the typical cause in local dev: missing/misconfigured ADC or a
 * gcloud login without a quota project) surface as 503 `server_unavailable`
 * — a fatal, batch-stopping code on the client — instead of an opaque 500.
 * The real cause is always logged server-side.
 */
export function internalErrorResponse(route: string, err: unknown): NextResponse {
  console.error(`[${route}] unexpected failure:`, err);
  const message = err instanceof Error ? err.message : String(err);
  const credentialIssue =
    /PERMISSION_DENIED|UNAUTHENTICATED|default credentials|quota project|invalid_grant|metadata/i.test(
      message,
    );
  return NextResponse.json(
    { error: credentialIssue ? 'server_unavailable' : 'internal' },
    { status: credentialIssue ? 503 : 500 },
  );
}
