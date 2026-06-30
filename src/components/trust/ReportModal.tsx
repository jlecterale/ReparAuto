'use client';

import { CheckCircle, Flag, WarningCircle, X } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { MOTIVOS_DENUNCIA } from '@/lib/constants';
import type { MotivoReport, TipoReport } from '@/types/report';

interface ReportModalProps {
  show: boolean;
  onClose: () => void;
  alvoTipo: TipoReport;
  onSubmit: (motivo: MotivoReport, descricao: string) => Promise<void>;
}

export default function ReportModal({ show, onClose, alvoTipo, onSubmit }: ReportModalProps) {
  const [motivo, setMotivo] = useState<MotivoReport | ''>('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!show) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [show]);

  if (!show) return null;

  const tipoLabel = alvoTipo === 'carro' ? 'anúncio' : alvoTipo === 'peca' ? 'peça' : 'utilizador';

  const handleSubmit = async () => {
    if (!motivo) return;
    setEnviando(true);
    setErro('');
    try {
      await onSubmit(motivo, descricao.trim());
      setEnviado(true);
    } catch {
      setErro('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    setMotivo('');
    setDescricao('');
    setEnviado(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/50"></div>
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-fg-heading flex items-center gap-2">
              <Flag className="text-red-500" />
              Denunciar {tipoLabel}
            </h3>
            <button onClick={handleClose} className="text-slate-400 hover:text-fg-muted transition">
              <X className="text-lg" />
            </button>
          </div>

          {enviado ? (
            <div className="text-center py-6">
              <CheckCircle className="text-green-500 text-3xl mb-3" />
              <p className="font-semibold text-fg-heading">Denúncia enviada!</p>
              <p className="text-sm text-fg-subtle mt-1">A nossa equipa irá analisar a sua denúncia brevemente.</p>
              <Button
                tipo="primario"
                onClick={handleClose}
                className="mt-4"
              >
                Fechar
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-fg-muted mb-4">
                Selecione o motivo da denúncia. A equipa da RecarGarage irá analisar o caso e tomar as medidas necessárias.
              </p>

              <div className="space-y-2 mb-4">
                {MOTIVOS_DENUNCIA.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      motivo === m.value
                        ? 'border-accent bg-accent/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="motivo"
                      value={m.value}
                      checked={motivo === m.value}
                      onChange={() => setMotivo(m.value)}
                      className="accent-accent"
                    />
                    <span className="text-sm font-medium text-fg-heading">{m.label}</span>
                  </label>
                ))}
              </div>

              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a situação com mais detalhe..."
                className="w-full border border-slate-300 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent mb-4"
                maxLength={1000}
              />

              {erro && (
                <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                  <WarningCircle /> {erro}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  tipo="secundario"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  tipo="perigo"
                  carregando={enviando}
                  disabled={!motivo || enviando}
                  onClick={handleSubmit}
                  icone={<Flag />}
                  className="flex-1"
                >
                  {enviando ? 'A enviar...' : 'Enviar Denúncia'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
