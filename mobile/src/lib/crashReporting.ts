/**
 * Wires uncaught JS exceptions to Crashlytics.
 *
 * This exists because of a real incident: a synchronous throw during module
 * load (before any UI/error boundary existed) crashed the app on launch, but
 * the TestFlight crash report only showed expo-updates' ON_ERROR_RECOVERY
 * giving up (ErrorRecovery.crash()) after failing to relaunch from a cached
 * update -- the original JS exception was never captured anywhere. Recording
 * it to Crashlytics before the default handler runs means the real error
 * shows up in the Firebase Console instead of being masked.
 */
import { crashlytics } from './firebase';

let installed = false;

export function setupCrashReporting(): void {
  if (installed) return;
  installed = true;

  const previousHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    crashlytics.recordError(error).catch(() => {});
    previousHandler(error, isFatal);
  });
}

/** Ties subsequent crash reports to the signed-in user, mirroring analytics. */
export function setCrashlyticsUser(uid: string | null): void {
  crashlytics.setUserId(uid ?? '').catch(() => {});
}
