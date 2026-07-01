import type { Metadata } from 'next';
import CriarIntencaoCompra from '@/components/intencao/CriarIntencaoCompra';

export const metadata: Metadata = {
  title: 'Comprar — encontre o que procura',
  description:
    'Diga-nos o que procura (carro, moto, peças, viatura comercial) e receba ofertas de vendedores no RecarGarage.',
  alternates: { canonical: '/comprar' },
};

export default function Page() {
  return <CriarIntencaoCompra />;
}
