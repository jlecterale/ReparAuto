import type { Metadata } from 'next';
import Home from '@/screens/Home';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Carros usados, peças e desmonte em Portugal',
  description:
    'Marketplace português de carros usados low-cost e em estado de reparação. Encontre o seu próximo carro a partir de 350€ ou venda o seu.',
  alternates: { canonical: '/app' },
  openGraph: {
    title: 'RecarGarage — Carros usados, peças e desmonte em Portugal',
    description:
      'Marketplace português de carros usados low-cost. Encontre o seu próximo carro a partir de 350€.',
    url: '/app',
  },
};

export default function Page() {
  return <Home />;
}
