import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { db } from '@/lib/firebase';

export interface AppUpdateInfo {
  /** A newer version than the installed one is published. */
  available: boolean;
  /** Installed version is below the minimum supported → update is mandatory. */
  required: boolean;
  /** Newest published version string. */
  latestVersion: string;
  /** Store URL for the current platform. */
  url: string;
  /** Optional custom message from the config doc. */
  mensagem?: string;
}

const DEFAULT_ANDROID_URL =
  'https://play.google.com/store/apps/details?id=com.recargarage';

/** Compares dotted version strings ("1.2.0"); returns <0 / 0 / >0 like a comparator. */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * Reads `config/app` (publicly readable per firestore.rules) and compares the
 * published version against the installed one. Returns null when the app is
 * up to date, the config is missing/invalid, or there's no store URL to send
 * the user to. The source of truth is a single admin-edited Firestore doc:
 *
 *   config/app = {
 *     latestVersion: "1.1.0",     // newest published build
 *     minVersion?:   "1.0.0",     // below this → mandatory update
 *     storeUrlAndroid?: "...",    // defaults to the Play Store listing
 *     storeUrlIos?:     "...",    // required to surface the banner on iOS
 *     mensagem?:        "...",    // optional custom copy
 *   }
 */
export function useAppUpdate(): AppUpdateInfo | null {
  const [info, setInfo] = useState<AppUpdateInfo | null>(null);

  useEffect(() => {
    const current = Constants.expoConfig?.version;
    if (!current) return; // can't compare without a known installed version
    let cancelled = false;

    db.collection('config')
      .doc('app')
      .get()
      .then((snap) => {
        if (cancelled) return;
        const d = snap.data();
        const latest = typeof d?.latestVersion === 'string' ? d.latestVersion : null;
        if (!latest) return;

        const min = typeof d?.minVersion === 'string' ? d.minVersion : null;
        const available = compareVersions(current, latest) < 0;
        const required = !!min && compareVersions(current, min) < 0;
        if (!available && !required) return; // up to date

        const url =
          (Platform.OS === 'ios'
            ? (d?.storeUrlIos as string | undefined)
            : (d?.storeUrlAndroid as string | undefined)) ??
          (Platform.OS === 'android' ? DEFAULT_ANDROID_URL : undefined);
        if (!url) return; // nowhere to send the user (e.g. iOS without a configured URL)

        setInfo({
          available,
          required,
          latestVersion: latest,
          url,
          mensagem: typeof d?.mensagem === 'string' ? d.mensagem : undefined,
        });
      })
      .catch(() => {
        // offline / missing config → no banner
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
