import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import '@/index.css';
import Providers from './providers';
import LayoutShell from '@/components/layout/LayoutShell';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reparauto-site.web.app';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#074C92',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ReparAuto — Carros Usados, Peças e Desmonte em Portugal',
    template: '%s · ReparAuto',
  },
  description:
    'Marketplace português de carros usados low-cost, peças e desmonte. Encontre o seu próximo carro, venda o seu ou descubra peças para reparação.',
  applicationName: 'ReparAuto',
  generator: 'Next.js',
  keywords: [
    'carros usados',
    'carros low-cost',
    'carros para reparar',
    'peças auto',
    'desmonte',
    'marketplace automóvel Portugal',
    'comprar carro usado',
    'vender carro',
  ],
  authors: [{ name: 'ReparAuto' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    url: SITE_URL,
    siteName: 'ReparAuto',
    title: 'ReparAuto — Carros Usados, Peças e Desmonte em Portugal',
    description:
      'Marketplace português de carros usados low-cost, peças e desmonte. Encontre o seu próximo carro, venda o seu ou descubra peças para reparação.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'ReparAuto' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReparAuto — Carros Usados, Peças e Desmonte em Portugal',
    description:
      'Marketplace português de carros usados low-cost, peças e desmonte.',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: { icon: '/favicon.svg' },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ReparAuto',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  sameAs: [] as string[],
  description:
    'Marketplace português de carros usados, peças e desmonte.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <Script
          id="ld-org"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
