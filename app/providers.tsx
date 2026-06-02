'use client';

import type { ReactNode } from 'react';
import AppProvider from '@/providers/AppProvider';
import { ToastProvider } from '@/components/ui/Toast';
import NativePushInit from '@/components/native/NativePushInit';
import NativeUIInit from '@/components/native/NativeUIInit';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <ToastProvider>
        <NativeUIInit />
        <NativePushInit />
        {children}
      </ToastProvider>
    </AppProvider>
  );
}
