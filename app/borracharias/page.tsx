import type { Metadata } from 'next';
import Oficinas from '@/screens/Oficinas';

export const metadata: Metadata = {
  title: 'Diretório de Borracharias e Vulcanizadores · RecarGarage',
  description: 'Encontre borracheiros, vulcanizadores e oficinas de pneus em Portugal e no Brasil. Troca de pneus, reparação de furos e alinhamento.',
  alternates: { canonical: '/borracharias' },
};

export default function Page() {
  return <Oficinas initialServiceType="tire_repair" />;
}
