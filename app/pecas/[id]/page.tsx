import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPecaPorIdServer } from '@/lib/db.server';
import Pecas from '@/screens/Pecas';
import { renderFoto } from '@/lib/utils';

export const revalidate = 60;

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reparauto-site.web.app';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const peca = await getPecaPorIdServer(id);
  if (!peca || peca.status !== 'aprovado') {
    return { title: 'Peça não encontrada · RecarGarage', robots: { index: false, follow: false } };
  }

  const preco = typeof peca.preco === 'number' ? ` · ${peca.preco.toLocaleString('pt-PT')}€` : '';
  const title = `${peca.titulo}${preco}`;
  const description = `${peca.titulo} — ${peca.categoria}, ${peca.estado}, em ${peca.local || 'Portugal'}. Anúncio no RecarGarage.`;

  // Share with the part's own photo; fall back to the branded OG image.
  const fotoData = peca.foto ? renderFoto(peca.foto) : null;
  const images = fotoData?.type === 'img' ? [fotoData.src] : [`${SITE_URL}/opengraph-image`];

  return {
    title,
    description,
    alternates: { canonical: `/pecas/${id}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/pecas/${id}`,
      images: images.map((url) => ({ url, width: 1200, height: 630, alt: peca.titulo })),
    },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const peca = await getPecaPorIdServer(id);
  if (!peca || peca.status !== 'aprovado') notFound();
  // Reuse the listing screen, opening this part's detail modal on top of it.
  return <Pecas initialPecaId={id} />;
}
