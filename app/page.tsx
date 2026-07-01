import type { Metadata } from 'next';
import LandingPage from '@/screens/LandingPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

export const metadata: Metadata = {
  title: 'RecarGarage — O Ecossistema Automóvel Completo em Portugal',
  description:
    'Mais do que comprar e vender. Carros, peças, mecânicos e oficinas — tudo ligado num só lugar. 100% gratuito e sem limites de anúncios.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'RecarGarage — O Ecossistema Automóvel Completo em Portugal',
    description:
      'Carros, peças, mecânicos e oficinas — tudo ligado num só lugar. Simples, rápido e 100% gratuito.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RecarGarage — O Ecossistema Automóvel Completo em Portugal',
    description:
      'Carros, peças, mecânicos e oficinas — tudo ligado num só lugar. 100% gratuito.',
  },
};

export default function Page() {
  return <LandingPage />;
}
