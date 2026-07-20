import type { Metadata } from 'next';
import Oficinas from '@/screens/Oficinas';

export const metadata: Metadata = {
  title: 'Diretório de Guinchos e Reboques · RecarGarage',
  description: 'Encontre serviços de guincho, reboque e auto-socorro rápido em Portugal e no Brasil. Disponíveis 24h para emergências.',
  alternates: { canonical: '/guinchos' },
};

export default function Page() {
  return <Oficinas initialServiceType="towing" />;
}
