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
            <h3 className="font-extrabold text-brand-900 flex items-center gap-2">
              <i className="fa-solid fa-flag text-red-500"></i>
              Denunciar {tipoLabel}
            </h3>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {enviado ? (
            <div className="text-center py-6">
              <i className="fa-solid fa-circle-check text-green-500 text-3xl mb-3"></i>
              <p className="font-semibold text-brand-900">Denúncia enviada!</p>
              <p className="text-sm text-slate-500 mt-1">A nossa equipa irá analisar a sua denúncia brevemente.</p>
              <button
                onClick={handleClose}
                className="mt-4 bg-accent hover:bg-accent-hover text-white font-bold text-sm px-6 py-2 rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Selecione o motivo da denúncia. A equipa da ReparAuto irá analisar o caso e tomar as medidas necessárias.
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
                    <span className="text-sm font-medium text-brand-900">{m.label}</span>
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
                  <i className="fa-solid fa-circle-exclamation"></i> {erro}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!motivo || enviando}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? (
                    <><i className="fa-solid fa-spinner fa-spin mr-1"></i> A enviar...</>
                  ) : (
                    <><i className="fa-solid fa-flag mr-1"></i> Enviar Denúncia</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
