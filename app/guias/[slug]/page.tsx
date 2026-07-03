import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import { GUIDES, GUIDE_CATEGORIES, getGuideBySlug } from '@/data/guias';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) {
    return { title: 'Guia não encontrado', robots: { index: false, follow: false } };
  }
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guias/${guide.slug}` },
    openGraph: {
      title: `${guide.title} · RecarGarage`,
      description: guide.description,
      url: `/guias/${guide.slug}`,
      type: 'article',
    },
  };
}

const categoryColor: Record<string, 'blue' | 'green' | 'yellow'> = {
  comprar: 'blue',
  vender: 'green',
  pecas: 'yellow',
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    dateModified: guide.updatedAt,
    inLanguage: 'pt-PT',
    mainEntityOfPage: `${SITE_URL}/guias/${guide.slug}`,
    author: { '@type': 'Organization', name: 'RecarGarage', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'RecarGarage', url: SITE_URL },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Guias', item: `${SITE_URL}/guias` },
      { '@type': 'ListItem', position: 2, name: guide.title, item: `${SITE_URL}/guias/${guide.slug}` },
    ],
  };

  const related = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto page-enter">
      <Script id={`guia-${guide.slug}-jsonld`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify([articleJsonLd, breadcrumbJsonLd])}
      </Script>

      <nav aria-label="Navegação" className="mb-4 text-xs text-fg-subtle">
        <Link href="/guias" className="font-semibold text-accent hover:underline">
          ← Todos os guias
        </Link>
      </nav>

      <article className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge cor={categoryColor[guide.category] ?? 'accent'}>
              {GUIDE_CATEGORIES[guide.category]}
            </Badge>
            <span className="text-[11px] text-fg-subtle">Leitura: {guide.readingMinutes} min</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fg-heading leading-tight">
            {guide.title}
          </h1>
        </header>

        <div className="space-y-3 mb-8">
          {guide.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-sm text-fg leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="space-y-8">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-fg-heading mb-3">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-sm text-fg leading-relaxed mb-3">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 40)} className="text-sm text-fg leading-relaxed flex gap-2">
                      <span className="text-accent font-bold shrink-0" aria-hidden="true">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-10 bg-accent/5 border border-accent/20 rounded-xl p-5 text-center">
          <p className="text-sm font-bold text-fg-heading mb-1">
            Pronto para pôr o guia em prática?
          </p>
          <p className="text-xs text-fg-muted mb-3">
            Explore carros usados com o estado declarado de forma transparente e peças com
            compatibilidade verificada.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/app"
              className="inline-block text-xs font-bold text-white bg-accent hover:opacity-90 transition rounded-full px-4 py-2"
            >
              Ver carros
            </Link>
            <Link
              href="/pecas"
              className="inline-block text-xs font-bold text-accent border border-accent/40 hover:bg-accent/10 transition rounded-full px-4 py-2"
            >
              Ver peças
            </Link>
          </div>
        </div>
      </article>

      <aside className="mt-8 mb-4">
        <h2 className="text-sm font-bold text-fg-heading mb-3">Outros guias</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {related.map((g) => (
            <Link
              key={g.slug}
              href={`/guias/${g.slug}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 group"
            >
              <p className="text-xs font-bold text-fg-heading leading-snug group-hover:text-accent transition">
                {g.title}
              </p>
              <span className="text-[11px] text-fg-subtle">Leitura: {g.readingMinutes} min</span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
