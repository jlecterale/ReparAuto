import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOficinaPorIdServer } from '@/lib/db.server';
import DetalhesOficina from '@/screens/DetalhesOficina';
import { renderFoto } from '@/lib/utils';

export const revalidate = 60;

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reparauto-site.web.app';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const oficina = await getOficinaPorIdServer(id);
  if (!oficina || oficina.status !== 'aprovado') {
    return { title: 'Oficina não encontrada · RecarGarage', robots: { index: false, follow: false } };
  }

  const local = [oficina.localidade, oficina.distrito].filter(Boolean).join(', ');
  const title = `${oficina.nome}${local ? ` · ${local}` : ''} · RecarGarage`;
  const description = (oficina.descricao || `Oficina e serviços automóveis em ${local || 'Portugal'}.`).slice(0, 200);

  // Share with the workshop's own image (logo, else first photo); fall back to
  // the site-wide branded OG image when it has neither.
  const rawImage = oficina.logoUrl || oficina.fotos?.[0];
  const fotoData = rawImage ? renderFoto(rawImage) : null;
  const images = fotoData?.type === 'img' ? [fotoData.src] : [`${SITE_URL}/opengraph-image`];

  return {
    title,
    description,
    alternates: { canonical: `/oficinas/detalhes/${id}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/oficinas/detalhes/${id}`,
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
