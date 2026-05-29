import { Suspense } from 'react';
import type { Metadata } from 'next';
import Pecas from '@/screens/Pecas';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Peças & Desmonte',
  description:
    'Mercado de peças automóveis e veículos completos para desmantelamento em Portugal. Compre, venda ou procure peças usadas.',
  alternates: { canonical: '/pecas' },
  openGraph: {
    title: 'Peças & Desmonte · ReparAuto',
    description:
      'Mercado de peças automóveis e veículos completos para desmantelamento em Portugal.',
    url: '/pecas',
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Pecas />
    </Suspense>
  );
}
