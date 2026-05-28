import { useSyncExternalStore } from 'react';

type ConnectionSpeed = 'fast' | 'slow' | 'offline';

interface NetworkStatus {
  online: boolean;
  speed: ConnectionSpeed;
  effectiveType: string | null;
  downlink: number | null;
}

interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

function getConnection(): NetworkInformation | null {
  const nav = navigator as typeof navigator & { connection?: NetworkInformation };
  return nav.connection || null;
}

let cachedSnapshot: NetworkStatus = buildSnapshot();

function buildSnapshot(): NetworkStatus {
  if (!navigator.onLine) {
    return { online: false, speed: 'offline', effectiveType: null, downlink: null };
  }

  const conn = getConnection();
  if (!conn) {
    return { online: true, speed: 'fast', effectiveType: null, downlink: null };
  }

  const slow = conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.downlink < 0.5;
  return {
    online: true,
    speed: slow ? 'slow' : 'fast',
    effectiveType: conn.effectiveType,
    downlink: conn.downlink,
  };
}

function updateSnapshot() {
  const next = buildSnapshot();
  if (
    next.online !== cachedSnapshot.online ||
    next.speed !== cachedSnapshot.speed ||
    next.effectiveType !== cachedSnapshot.effectiveType ||
    next.downlink !== cachedSnapshot.downlink
  ) {
    cachedSnapshot = next;
  }
}

function getSnapshot(): NetworkStatus {
  return cachedSnapshot;
}

function subscribe(callback: () => void) {
  const onChange = () => {
    updateSnapshot();
    callback();
  };
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  const conn = getConnection();
  if (conn) conn.addEventListener('change', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
    if (conn) conn.removeEventListener('change', onChange);
  };
}

function getServerSnapshot(): NetworkStatus {
  return { online: true, speed: 'fast', effectiveType: null, downlink: null };
}

export default function useNetworkStatus(): NetworkStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
