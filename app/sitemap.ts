import type { MetadataRoute } from 'next';
import { getCarrosServer } from '@/lib/db.server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const carros = await getCarrosServer().catch(() => []);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/app`, changeFrequency: 'daily', priority: 0.95 },
    { url: `${SITE_URL}/pecas`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/oficinas`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/anunciar`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/termos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/cookies`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/seguranca`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const carroEntries: MetadataRoute.Sitemap = carros.map((c) => {
    const ts =
      (c.dataAprovacao as unknown as { toDate?: () => Date })?.toDate?.() ||
      (c.dataCriacao as unknown as { toDate?: () => Date })?.toDate?.();
    return {
      url: `${SITE_URL}/detalhes/${c.id}`,
      lastModified: ts instanceof Date ? ts : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    };
  });

  return [...staticEntries, ...carroEntries];
}
