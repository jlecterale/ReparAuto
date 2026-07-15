import type { Metadata } from 'next';
import Mercado from '@/screens/Mercado';

export const metadata: Metadata = {
  title: 'Mercado de carros usados em Portugal',
  description:
    'Estatísticas, distribuições e tendências de preços no mercado português de carros usados, com base nos anúncios do RecarGarage.',
  alternates: { canonical: '/mercado' },
  openGraph: {
    title: 'Mercado — RecarGarage',
    description: 'Estatísticas do mercado de carros usados em Portugal.',
    url: '/mercado',
  },
};

export default function Page() {
  return <Mercado />;
}
