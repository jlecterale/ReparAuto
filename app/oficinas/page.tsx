import type { Metadata } from 'next';
import Oficinas from '@/screens/Oficinas';

export const metadata: Metadata = {
  title: 'Diretório de Oficinas e Mecânicos · ReparAuto',
  description: 'Encontre oficinas, mecânicos e especialistas do setor automóvel em Portugal. Preparação, mecânica convencional, pintura e muito mais.',
  alternates: { canonical: '/oficinas' },
};

export default function Page() {
  return <Oficinas />;
}
