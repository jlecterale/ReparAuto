'use client';

import { useState } from 'react';
import { CurrencyEur, PaperPlaneTilt, Heart, Car } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatarPreco } from '@/lib/utils';
import type { TipoAnuncio } from '@/types/proposal';

interface ContraPropostaModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (valor: number, mensagem: string) => Promise<void>;
  anuncioTitulo: string;
  anuncioPrecoOriginal: number;
  anuncioTipo: TipoAnuncio;
  compradorNome: string;
}

export default function ContraPropostaModal({
  show,
  onClose,
  onSubmit,
  anuncioTitulo,
  anuncioPrecoOriginal,
  anuncioTipo,
  compradorNome,
}: ContraPropostaModalProps) {
  const [valor, setValor] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const toast = useToast();

  const tipoLabel: Record<TipoAnuncio, string> = {
    carro: 'Carro',
    peca: 'Peça',
    servico: 'Serviço',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const valorNum = parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      toast?.erro('Insira um valor válido para a contra-proposta.');
      return;
    }

    setEnviando(true);
    try {
      await onSubmit(valorNum, mensagem.trim());
      toast?.sucesso('Contra-proposta enviada com sucesso!');
      setValor('');
      setMensagem('');
      onClose();
    } catch {
      toast?.erro('Erro ao enviar contra-proposta. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  function handleClose() {
    if (!enviando) {
      setValor('');
      setMensagem('');
      onClose();
    }
  }

  return (
    <Modal show={show} onClose={handleClose} titulo="Fazer Contra-Proposta" tamanho="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Listing info */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white shrink-0">
            <Car size={20} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-fg-heading truncate">{anuncioTitulo}</p>
            <div className="flex items-center gap-2 text-xs text-fg-subtle">
              <span className="bg-white/80 px-2 py-0.5 rounded-full font-medium">{tipoLabel[anuncioTipo]}</span>
              <span>•</span>
              <span className="font-bold text-accent">{formatarPreco(anuncioPrecoOriginal)}</span>
            </div>
          </div>
        </div>

        {/* Interested buyer info */}
        <div className="flex items-center gap-2 text-sm text-fg-muted bg-pink-50 rounded-xl px-4 py-3 border border-pink-100">
          <Heart size={16} weight="fill" className="text-pink-500 shrink-0" />
          <span>
            <strong className="text-fg-heading">{compradorNome}</strong> favoritou este anúncio
          </span>
        </div>

        {/* Value field */}
        <div>
          <label htmlFor="proposta-valor" className="block text-sm font-bold text-fg-heading mb-1.5">
            Valor da Contra-Proposta
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <CurrencyEur size={18} className="text-fg-subtle" />
            </div>
            <input
              id="proposta-valor"
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex: 5.500"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-fg-heading placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              required
              disabled={enviando}
            />
          </div>
          {anuncioPrecoOriginal > 0 && (
            <p className="text-xs text-fg-subtle mt-1.5">
              Preço anunciado: <strong>{formatarPreco(anuncioPrecoOriginal)}</strong>
            </p>
          )}
        </div>

        {/* Message field */}
        <div>
          <label htmlFor="proposta-mensagem" className="block text-sm font-bold text-fg-heading mb-1.5">
            Mensagem <span className="text-fg-subtle font-normal">(opcional)</span>
          </label>
          <textarea
            id="proposta-mensagem"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Ex: Olá! Vi que se interessou pelo meu anúncio. Posso fazer-lhe um preço especial..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-fg resize-none placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
            disabled={enviando}
          />
          <p className="text-xs text-fg-subtle text-right mt-1">{mensagem.length}/500</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={enviando}
            className="flex-1 px-4 py-3 text-sm font-bold text-fg-muted bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-accent to-accent-hover rounded-xl hover:shadow-lg hover:shadow-accent/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {enviando ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <PaperPlaneTilt size={16} weight="fill" />
            )}
            {enviando ? 'A enviar...' : 'Enviar Proposta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
