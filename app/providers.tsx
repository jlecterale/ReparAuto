'use client';

import type { ReactNode } from 'react';
import AppProvider from '@/providers/AppProvider';
import CountryProvider from '@/providers/CountryProvider';
import { ToastProvider } from '@/components/ui/Toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CountryProvider>
      <AppProvider>
        <ToastProvider>{children}</ToastProvider>
      </AppProvider>
    </CountryProvider>
  );
}
