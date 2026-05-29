'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { TEXTOS_POLITICAS } from '@/lib/constants';
import Button from '@/components/ui/Button';

const titulos: Record<string, string> = {
  termos: 'Termos de Utilização',
  privacidade: 'Política de Privacidade',
  cookies: 'Política de Cookies',
  seguranca: 'Segurança',
};

export default function PoliticaPage({ tipo }: { tipo?: string }) {
  const router = useRouter();

  const titulo = titulos[tipo || ''] || 'Política';
  const conteudo = TEXTOS_POLITICAS[tipo as keyof typeof TEXTOS_POLITICAS]?.corpo || 'Conteúdo não encontrado.';

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
