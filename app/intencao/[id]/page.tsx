import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIntencaoPorIdServer } from '@/lib/db.server';
import DetalhesIntencao from '@/screens/DetalhesIntencao';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const intencao = await getIntencaoPorIdServer(id);
  if (!intencao || intencao.status !== 'ativa') {
    return { title: 'Intenção não encontrada', robots: { index: false, follow: false } };
  }
  const title = intencao.titulo;
  const description = `${intencao.criterios.marca} ${intencao.criterios.modelo} • Ano ${intencao.criterios.anoMinimo}${intencao.criterios.anoMaximo ? `–${intencao.criterios.anoMaximo}` : '+'} • Orçamento até ${intencao.criterios.precoMaximo.toLocaleString('pt-PT')}€ • ${intencao.criterios.combustivel.join(', ')} • ${intencao.criterios.localizacao.distrito}`;

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
