import type { Metadata } from 'next';
import PainelProfissional from '@/screens/PainelProfissional';

export const metadata: Metadata = {
  title: 'Painel Profissional',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PainelProfissional />;
}
