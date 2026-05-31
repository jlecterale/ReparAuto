import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getCarroPorIdServer } from '@/lib/db.server';
import DetalhesCarro from '@/screens/DetalhesCarro';
import { renderFoto } from '@/lib/utils';

export const revalidate = 60;

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reparauto-site.web.app';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const carro = await getCarroPorIdServer(id);
  if (!carro || carro.status !== 'aprovado') {
    return { title: 'Anúncio não encontrado', robots: { index: false, follow: false } };
  }
  const title = `${carro.marca} ${carro.modelo} ${carro.anoFabricacao} · ${carro.preco.toLocaleString('pt-PT')}€`;
  const description = `${carro.marca} ${carro.modelo} de ${carro.anoFabricacao}, ${(carro.km || 0).toLocaleString('pt-PT')} km, ${carro.combustivel}, ${carro.cambio}, em ${carro.local || 'Portugal'}. ${carro.estadoVeiculo === 'manutencao' ? 'Precisa de manutenção. ' : ''}Anúncio no ReparAuto.`;

  const fotoData = carro.fotos?.[0] ? renderFoto(carro.fotos[0]) : null;
  const images = fotoData?.type === 'img' ? [fotoData.src] : [`${SITE_URL}/og-default.png`];

  return {
    title,
    description,
    alternates: { canonical: `/detalhes/${id}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/detalhes/${id}`,
      images: images.map((url) => ({ url, width: 1200, height: 630, alt: title })),
    },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const carro = await getCarroPorIdServer(id);
  if (!carro || carro.status !== 'aprovado') notFound();

  const fotoData = carro.fotos?.[0] ? renderFoto(carro.fotos[0]) : null;
  const imageUrl = fotoData?.type === 'img' ? fotoData.src : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: `${carro.marca} ${carro.modelo}`,
    brand: { '@type': 'Brand', name: carro.marca },
    model: carro.modelo,
    vehicleModelDate: String(carro.anoModelo || carro.anoFabricacao),
    productionDate: String(carro.anoFabricacao),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: carro.km, unitCode: 'KMT' },
    fuelType: carro.combustivel,
    vehicleTransmission: carro.cambio,
    color: carro.cor,
    numberOfDoors: carro.portas,
    image: imageUrl,
    description: (carro.descricao || '').slice(0, 500),
    offers: {
      '@type': 'Offer',
      price: carro.preco,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/detalhes/${id}`,
      areaServed: carro.local,
    },
  };

  return (
    <>
      <Script
        id={`ld-vehicle-${id}`}
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DetalhesCarro />
    </>
  );
}
