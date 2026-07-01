import type { Metadata } from 'next';
import AvaliarVeiculo from '@/screens/AvaliarVeiculo';

export const metadata: Metadata = {
  title: 'Avaliar veículo — estimativa de preço',
  description:
    'Estime o preço do seu carro usado com base em anúncios reais publicados no RecarGarage. Avaliação grátis e em poucos segundos.',
  alternates: { canonical: '/avaliar-veiculo' },
  openGraph: {
    title: 'Avaliar veículo — RecarGarage',
    description: 'Estime o valor do seu carro usado em segundos, com dados reais do mercado.',
    url: '/avaliar-veiculo',
  },
};

export default function Page() {
  return <AvaliarVeiculo />;
}
