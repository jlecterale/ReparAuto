import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOficinaPorIdServer } from '@/lib/db.server';
import DetalhesOficina from '@/screens/DetalhesOficina';
import { renderFoto } from '@/lib/utils';

export const revalidate = 60;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [];
}

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const oficina = await getOficinaPorIdServer(id);
  if (!oficina || oficina.status !== 'aprovado') {
    return { title: 'Serviço não encontrado · RecarGarage', robots: { index: false, follow: false } };
  }

  const local = [oficina.localidade, oficina.distrito].filter(Boolean).join(', ');
  const serviceLabel = oficina.country === 'BR' ? 'Borracharia & Borracheiro' : 'Vulcanizador & Pneus';
  const title = `${oficina.nome} · ${serviceLabel} em ${local || 'Portugal'} · RecarGarage`;
  const description = (oficina.descricao || `Serviço de pneus, borracharia e vulcanizador em ${local || 'Portugal'}.`).slice(0, 200);

  const rawImage = oficina.logoUrl || oficina.fotos?.[0];
  const fotoData = rawImage ? renderFoto(rawImage) : null;
  const images = fotoData?.type === 'img' ? [fotoData.src] : [`${SITE_URL}/opengraph-image`];

  return {
    title,
    description,
    alternates: { canonical: `/borracharias/detalhes/${id}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/borracharias/detalhes/${id}`,
      images: images.map((url) => ({ url, width: 1200, height: 630, alt: oficina.nome })),
    },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const oficina = await getOficinaPorIdServer(id);
  if (!oficina || oficina.status !== 'aprovado') notFound();
  return <DetalhesOficina id={id} />;
}
