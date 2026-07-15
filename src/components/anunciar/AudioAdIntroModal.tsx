'use client';

// One-time highlight for the voice-listing feature (plan 24). Shown once per
// browser when the user opens /anunciar, then remembered via localStorage so it
// never nags again — mirrors the dismiss pattern in MonetizationCarousel.

import { useEffect, useState } from 'react';
import { Microphone, MusicNote, Sparkle } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const SEEN_KEY = 'audio_ad_intro_seen_v1';

export default function AudioAdIntroModal() {
  // Start hidden and decide after mount — reading localStorage during render
  // would cause an SSR/client hydration mismatch.
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY) !== '1') setShow(true);
    } catch {
      // private mode / storage disabled — just don't show the intro.
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // ignore storage errors (private mode)
    }
  };

  return (
    <Modal show={show} onClose={dismiss} titulo="Novidade: anuncie por voz" tamanho="md">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Microphone size={32} weight="fill" className="text-accent" />
        </div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
          <Sparkle size={12} weight="fill" /> Novo • IA
        </div>
        <h4 className="text-lg font-extrabold text-fg-heading">Descreva o anúncio a falar</h4>
        <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
          Grave um áudio a descrever o carro ou a peça — marca, modelo, ano, quilómetros,
          cor, preço… — e a nossa IA preenche o formulário por si. No fim, só lhe faltam as
          fotos.
        </p>

        <ul className="mx-auto mt-4 max-w-sm space-y-2 text-left text-sm text-fg">
          <li className="flex items-center gap-2">
            <Microphone size={18} weight="fill" className="shrink-0 text-accent" />
            Grave na hora, diretamente no formulário.
          </li>
          <li className="flex items-center gap-2">
            <MusicNote size={18} weight="fill" className="shrink-0 text-accent" />
            Ou envie um áudio que já tenha (mp3, nota de voz…).
          </li>
          <li className="flex items-center gap-2">
            <Sparkle size={18} weight="fill" className="shrink-0 text-accent" />
            Reveja os campos preenchidos antes de publicar.
          </li>
        </ul>

        <Button tipo="primario" tamanho="lg" blocoCompleto className="mt-6" onClick={dismiss}>
          Experimentar
        </Button>
      </div>
    </Modal>
  );
}
