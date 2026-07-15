import type { Metadata } from 'next';
import Home from '@/screens/Home';
import { getCarrosServer } from '@/lib/db.server';
import { serializeCarro } from '@/lib/serializeCarro';

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

export default async function Page() {
  // Bake the approved listings into the ISR HTML so cards paint immediately;
  // the client's realtime subscription takes over once connected.
  const carros = await getCarrosServer().catch(() => []);
  const initialCarros = carros
    .map(serializeCarro)
    .sort((a, b) => (b.dataCriacao ?? 0) - (a.dataCriacao ?? 0));

  return <Home initialCarros={initialCarros} />;
}
