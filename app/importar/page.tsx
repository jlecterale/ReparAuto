import type { Metadata } from 'next';
import ImportStandvirtual from '@/screens/ImportStandvirtual';

export const metadata: Metadata = {
  title: 'Importar anúncios do Standvirtual',
  description: 'Importe os seus anúncios do Standvirtual para o RecarGarage em minutos.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ImportStandvirtual />;
}
