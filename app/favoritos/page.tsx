import type { Metadata } from 'next';
import Favoritos from '@/screens/Favoritos';

export const metadata: Metadata = {
  title: 'Os Meus Favoritos',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Favoritos />;
}
