import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import Badge from '@/components/ui/Badge';
import { GUIDES, GUIDE_CATEGORIES } from '@/data/guias';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

export const metadata: Metadata = {
  title: 'Guias de Compra e Venda de Carros Usados e Peças',
  description:
    'Guias práticos do RecarGarage: comprar carro usado para reparar, verificar histórico, negociar preço, comprar peças usadas e tratar da documentação em Portugal.',
  alternates: { canonical: '/guias' },
  openGraph: {
    title: 'Guias RecarGarage — carros usados, reparação e peças',
    description:
      'Guias práticos para comprar e vender carros usados (mesmo com avarias) e peças auto com segurança.',
    url: '/guias',
  },
};

const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: GUIDES.map((guide, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: guide.title,
    url: `${SITE_URL}/guias/${guide.slug}`,
  })),
};

const categoryColor: Record<string, 'blue' | 'green' | 'yellow'> = {
  comprar: 'blue',
  vender: 'green',
  pecas: 'yellow',
};

export default function Page() {
  return (
    <div className="max-w-5xl mx-auto page-enter">
      <Script id="guias-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(itemListJsonLd)}
      </Script>

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-fg-heading mb-2">
          Guias RecarGarage
        </h1>
        <p className="text-sm text-fg-muted max-w-2xl">
          Comprar um carro para reparar, verificar o histórico, negociar o preço, escolher peças
          usadas ou tratar da papelada — passo a passo, sem rodeios.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guias/${guide.slug}`}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-5 flex flex-col group"
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge cor={categoryColor[guide.category] ?? 'accent'}>
                {GUIDE_CATEGORIES[guide.category]}
              </Badge>
              <span className="text-[11px] text-fg-subtle">
                Leitura: {guide.readingMinutes} min
              </span>
            </div>
            <h2 className="font-extrabold text-fg-heading leading-snug group-hover:text-accent transition">
              {guide.title}
            </h2>
            <p className="text-xs text-fg-muted mt-2 leading-relaxed flex-1">{guide.description}</p>
            <span className="text-xs font-bold text-accent mt-3">Ler o guia →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
