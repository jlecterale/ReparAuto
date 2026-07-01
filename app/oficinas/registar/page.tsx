import type { Metadata } from 'next';
import RegistarOficina from '@/screens/RegistarOficina';

export const metadata: Metadata = {
  title: 'Registar Oficina ou Mecânico · RecarGarage',
  description: 'Registe a sua oficina ou perfil profissional de mecânico no RecarGarage para alcançar mais clientes.',
  alternates: { canonical: '/oficinas/registar' },
};

export default function Page() {
  return <RegistarOficina />;
}
