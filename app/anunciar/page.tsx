import type { Metadata } from 'next';
import { Suspense } from 'react';
import Anunciar from '@/screens/Anunciar';

export const metadata: Metadata = {
  title: 'Anunciar carro ou peça',
  description: 'Publique gratuitamente o seu carro usado, peça ou veículo para desmonte no ReparAuto.',
  alternates: { canonical: '/anunciar' },
};

export default function Page() {
  // Anunciar reads ?tipo via useSearchParams — needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <Anunciar />
    </Suspense>
  );
}
