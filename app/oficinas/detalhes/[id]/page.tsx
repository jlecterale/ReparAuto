import type { Metadata } from 'next';
import DetalhesOficina from '@/screens/DetalhesOficina';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Detalhes da Oficina · ReparAuto',
    alternates: { canonical: `/oficinas/detalhes/${id}` },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <DetalhesOficina id={id} />;
}
