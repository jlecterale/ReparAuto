import type { Metadata, Viewport } from 'next';
import { Libre_Franklin } from 'next/font/google';
import Script from 'next/script';
import '@/index.css';
import Providers from './providers';
import LayoutShell from '@/components/layout/LayoutShell';

const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#074C92',
  // The app has no dark theme — force a light color scheme so browsers don't
  // apply their dark-mode UA styling to form controls when the OS is in dark mode.
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RecarGarage — Carros Usados, Peças e Desmonte em Portugal',
    template: '%s · RecarGarage',
  },
  description:
    'Marketplace português de carros usados low-cost, peças e desmonte. Encontre o seu próximo carro, venda o seu ou descubra peças para reparação.',
  applicationName: 'RecarGarage',
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
  authors: [{ name: 'RecarGarage' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    url: SITE_URL,
    siteName: 'RecarGarage',
    title: 'RecarGarage — Carros Usados, Peças e Desmonte em Portugal',
    description:
      'Marketplace português de carros usados low-cost, peças e desmonte. Encontre o seu próximo carro, venda o seu ou descubra peças para reparação.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'RecarGarage' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RecarGarage — Carros Usados, Peças e Desmonte em Portugal',
    description:
      'Marketplace português de carros usados low-cost, peças e desmonte.',
    images: ['/opengraph-image'],
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
  name: 'RecarGarage',
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
        <Script
          id="ld-org"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${libreFranklin.className} antialiased`}>
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
