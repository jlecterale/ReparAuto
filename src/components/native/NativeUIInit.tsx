'use client';

import { useEffect } from 'react';
import { initNativeStatusBar } from '@/lib/native/statusBar';

/**
 * Headless component that applies native UI chrome configuration (status bar
 * style) on mount. Renders nothing and is a no-op on the web.
 */
export default function NativeUIInit() {
  useEffect(() => {
    void initNativeStatusBar();
  }, []);
  return null;
}
