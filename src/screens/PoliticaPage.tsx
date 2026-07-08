'use client';

import { Suspense } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TEXTOS_POLITICAS, getPolicy } from '@/lib/constants';
import { useCountry } from '@/providers/CountryProvider';
import type { Country } from '@/lib/country';
import Button from '@/components/ui/Button';

const titulos: Record<string, string> = {
  termos: 'Termos de Utilização',
  privacidade: 'Política de Privacidade',
  cookies: 'Política de Cookies',
  seguranca: 'Segurança',
};

function PoliticaContent({ tipo }: { tipo?: string }) {
  const router = useRouter();
  // The privacy policy has a Brazil (LGPD) variant; other policies fall back to
  // the Portuguese (RGPD) text. getPolicy resolves by the active market, but an
  // explicit `?mercado=` wins — the mobile app passes the account market when
  // opening these pages so a fresh browser session shows the right variant.
  const { country } = useCountry();
  const mercado = useSearchParams().get('mercado');
  const effectiveCountry: Country = mercado === 'BR' || mercado === 'PT' ? mercado : country;

  const titulo = titulos[tipo || ''] || 'Política';
  const validTipo = tipo && tipo in TEXTOS_POLITICAS ? (tipo as keyof typeof TEXTOS_POLITICAS) : null;
  const conteudo = validTipo ? getPolicy(validTipo, effectiveCountry).corpo : 'Conteúdo não encontrado.';

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-5 sm:p-8 page-enter">
      <Button
        tipo="terciario"
        tamanho="sm"
        icone={<ArrowLeft />}
        onClick={() => router.back()}
        className="mb-4"
      >
        Voltar
      </Button>
      <h1 className="text-2xl font-extrabold text-fg-heading mb-4">{titulo}</h1>
      <div
        className="text-sm text-fg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: conteudo }}
      />
    </div>
  );
}

export default function PoliticaPage({ tipo }: { tipo?: string }) {
  // useSearchParams needs a Suspense boundary in statically-generated routes.
  return (
    <Suspense fallback={null}>
      <PoliticaContent tipo={tipo} />
    </Suspense>
  );
}
