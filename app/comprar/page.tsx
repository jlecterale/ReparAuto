import type { Metadata } from 'next';
import CriarIntencaoCompra from '@/components/intencao/CriarIntencaoCompra';

export const metadata: Metadata = {
  title: 'Comprar carro — descreva o que procura',
  description:
    'Diga-nos o carro que procura (marca, modelo, ano, cor, preço e mais) e receba ofertas de vendedores no ReparAuto.',
  alternates: { canonical: '/comprar' },
};

export default function Page() {
  return <CriarIntencaoCompra />;
}
