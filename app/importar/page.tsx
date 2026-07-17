import type { Metadata } from 'next';
import ImportStandvirtual from '@/screens/ImportStandvirtual';

export const metadata: Metadata = {
  title: 'Importar anúncios',
  description: 'Importe os seus anúncios para o RecarGarage em minutos.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ImportStandvirtual />;
}
