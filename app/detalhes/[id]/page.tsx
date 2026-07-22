import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getCarroPorIdServer, getCarrosServer } from '@/lib/db.server';
import { serializeCarro } from '@/lib/serializeCarro';
import DetalhesCarro from '@/screens/DetalhesCarro';
import { formatarKm, formatarPreco, renderFoto } from '@/lib/utils';
import { COUNTRY_INFO, docCountry } from '@/lib/country';

export const revalidate = 60;

// Pre-render every approved listing at build time; listings published later
// are rendered on demand (dynamicParams) and cached. Registering static params
// is also what opts this route into ISR — without it Next treats the route as
// fully dynamic and re-renders (Firestore fetch included) on every click.
export async function generateStaticParams() {
  const carros = await getCarrosServer().catch(() => []);
  return carros.map((carro) => ({ id: carro.id }));
}

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://recargarage.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const carro = await getCarroPorIdServer(id);
  if (!carro || carro.status !== 'aprovado') {
    return { title: 'Anúncio não encontrado', robots: { index: false, follow: false } };
  }
  const country = docCountry(carro);
  const title = `${carro.marca} ${carro.modelo} ${carro.anoFabricacao} · ${formatarPreco(carro.preco, country)}`;
  const description = `${carro.marca} ${carro.modelo} de ${carro.anoFabricacao}, ${formatarKm(carro.km || 0, country)}, ${carro.combustivel}, ${carro.cambio}, em ${carro.local || COUNTRY_INFO[country].name}. ${carro.estadoVeiculo === 'manutencao' ? 'Precisa de manutenção. ' : ''}Anúncio no RecarGarage.`;

  const fotoData = carro.fotos?.[0] ? renderFoto(carro.fotos[0]) : null;
  const images = fotoData?.type === 'img' ? [fotoData.src] : [`${SITE_URL}/opengraph-image`];

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

  const itemCondition =
    carro.condition === 'Novo'
      ? 'https://schema.org/NewCondition'
      : carro.condition === 'Para peças'
        ? 'https://schema.org/DamagedCondition'
        : 'https://schema.org/UsedCondition';

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
    ...(carro.bodyType ? { bodyType: carro.bodyType } : {}),
    ...(carro.seats ? { seatingCapacity: carro.seats } : {}),
    ...(carro.traction ? { driveWheelConfiguration: carro.traction } : {}),
    ...(carro.gears != null ? { numberOfForwardGears: carro.gears } : {}),
    ...(carro.previousOwners != null ? { numberOfPreviousOwners: carro.previousOwners } : {}),
    ...(carro.numberOfAirbags != null ? { numberOfAirbags: carro.numberOfAirbags } : {}),
    ...(carro.co2Emissions != null ? { emissionsCO2: carro.co2Emissions } : {}),
    ...(carro.upholstery ? { vehicleInteriorType: carro.upholstery } : {}),
    ...(carro.consumptionCombined != null
      ? { fuelConsumption: { '@type': 'QuantitativeValue', value: carro.consumptionCombined, unitText: 'l/100km' } }
      : {}),
    ...(carro.firstRegistrationMonth
      ? { dateVehicleFirstRegistered: `${carro.anoFabricacao}-${String(carro.firstRegistrationMonth).padStart(2, '0')}` }
      : {}),
    ...(carro.displacement || carro.power
      ? {
          vehicleEngine: {
            '@type': 'EngineSpecification',
            ...(carro.displacement
              ? { engineDisplacement: { '@type': 'QuantitativeValue', value: carro.displacement, unitCode: 'CMQ' } }
              : {}),
            ...(carro.power
              ? { enginePower: { '@type': 'QuantitativeValue', value: carro.power, unitText: 'cv' } }
              : {}),
          },
        }
      : {}),
    ...(carro.features && carro.features.length > 0 ? { vehicleConfiguration: carro.features.join(', ') } : {}),
    image: imageUrl,
    description: (carro.descricao || '').slice(0, 500),
    offers: {
      '@type': 'Offer',
      price: carro.preco,
      priceCurrency: COUNTRY_INFO[docCountry(carro)].currency,
      availability: 'https://schema.org/InStock',
      itemCondition,
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
      <DetalhesCarro initialCarro={serializeCarro(carro)} />
    </>
  );
}
