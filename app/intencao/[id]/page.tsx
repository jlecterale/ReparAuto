import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIntencaoPorIdServer } from '@/lib/db.server';
import DetalhesIntencao from '@/screens/DetalhesIntencao';
import { formatarPreco } from '@/lib/utils';
import { docCountry } from '@/lib/country';

// The page body is client-rendered; only generateMetadata reads Firestore,
// so a short ISR window beats re-fetching on every request.
export const revalidate = 300;

// No intent-list server fetcher exists, so nothing is pre-rendered at build
// time — but registering (empty) static params still opts the route into ISR:
// each intent page renders once on demand and is then served from cache.
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [];
}

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const intencao = await getIntencaoPorIdServer(id);
  if (!intencao || intencao.status !== 'ativa') {
    return { title: 'Intenção não encontrada', robots: { index: false, follow: false } };
  }
  const title = intencao.titulo;
  const description = `${intencao.criterios.marca} ${intencao.criterios.modelo} • Ano ${intencao.criterios.anoMinimo}${intencao.criterios.anoMaximo ? `–${intencao.criterios.anoMaximo}` : '+'} • Orçamento até ${formatarPreco(intencao.criterios.precoMaximo, docCountry(intencao))} • ${intencao.criterios.combustivel.join(', ')} • ${intencao.criterios.localizacao.distrito}`;

  return {
    title,
    description,
    alternates: { canonical: `/intencao/${id}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/intencao/${id}`,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page() {
  return <DetalhesIntencao />;
}
