'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import CompatibilitySelector from '@/components/pecas/CompatibilitySelector';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import { useApp } from '@/providers/AppProvider';
import { CATEGORIAS_PECAS, ESTADOS_PECA } from '@/lib/constants';
import { addPecasBatch, getAdminUsers, criarNotificacao } from '@/lib/db';
import { getCoordenadas } from '@/lib/geo';
import { pickDefined } from '@/lib/compatibility';
import type { CompatibilityEntry } from '@/types/peca';

interface Props {
  show: boolean;
  onClose: () => void;
}

interface DraftPart {
  id: string;
  titulo: string;
  categoria: string;
  preco: string;
  estado: string;
  precoNovoReferencia: string;
}

const SUGGESTED_PARTS: { titulo: string; categoria: string }[] = [
  { titulo: 'Motor', categoria: 'Motor e Transmissão' },
  { titulo: 'Caixa de velocidades', categoria: 'Motor e Transmissão' },
  { titulo: 'Farol esquerdo', categoria: 'Iluminação e Óticas' },
  { titulo: 'Farol direito', categoria: 'Iluminação e Óticas' },
  { titulo: 'Capot', categoria: 'Carroçaria e Chaparia' },
  { titulo: 'Para-choques frontal', categoria: 'Carroçaria e Chaparia' },
  { titulo: 'Para-choques traseiro', categoria: 'Carroçaria e Chaparia' },
  { titulo: 'Porta esquerda frente', categoria: 'Carroçaria e Chaparia' },
  { titulo: 'Porta direita frente', categoria: 'Carroçaria e Chaparia' },
  { titulo: 'Bancos completos', categoria: 'Interior e Bancos' },
  { titulo: 'Tablier', categoria: 'Interior e Bancos' },
  { titulo: 'Centralina ECU', categoria: 'Eletrónica e Sensores' },
  { titulo: 'Discos e pastilhas', categoria: 'Suspensão e Travões' },
  { titulo: 'Amortecedores', categoria: 'Suspensão e Travões' },
];

const newId = () => Math.random().toString(36).slice(2, 10);

const makeDraft = (titulo = '', categoria = 'Motor e Transmissão'): DraftPart => ({
  id: newId(),
  titulo,
  categoria,
  preco: '',
  estado: 'Usado (Segunda Mão)',
  precoNovoReferencia: '',
});

export default function DesmancharCarroModal({ show, onClose }: Props) {
  const { auth } = useApp();
  const { user } = auth;

  const [step, setStep] = useState<1 | 2>(1);
  const [compatibilidades, setCompatibilidades] = useState<CompatibilityEntry[]>([]);
  const [descricaoVeiculo, setDescricaoVeiculo] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [localizacaoDistrito, setLocalizacaoDistrito] = useState('');
  const [vendedorWhatsApp, setVendedorWhatsApp] = useState(user?.telefone || '');
  const [parts, setParts] = useState<DraftPart[]>([makeDraft()]);
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(1);
    setCompatibilidades([]);
    setDescricaoVeiculo('');
    setLocalizacao('');
    setLocalizacaoDistrito('');
    setVendedorWhatsApp(user?.telefone || '');
    setParts([makeDraft()]);
    setErro('');
    setSubmitting(false);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const nextStep = () => {
    if (compatibilidades.length === 0) {
      setErro('Adicione pelo menos uma compatibilidade (marca/modelo do veículo).');
      return;
    }
    setErro('');
    setStep(2);
  };

  const addPart = (titulo = '', categoria = 'Motor e Transmissão') => {
    setParts((prev) => [...prev, makeDraft(titulo, categoria)]);
  };

  const updatePart = (id: string, field: keyof DraftPart, value: string) => {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removePart = (id: string) => {
    setParts((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };

  const submit = async () => {
    const validParts = parts.filter((p) => p.titulo.trim());
    if (validParts.length === 0) {
      setErro('Adicione pelo menos uma peça com título.');
      return;
    }
    setSubmitting(true);
    setErro('');
    try {
      const primaria = compatibilidades[0];
      const loteId = `lote-${Date.now()}-${newId()}`;
      const coords = localizacao ? getCoordenadas(localizacao) : undefined;
      const marcaModelo = `${primaria.marca}${primaria.modelo ? ' ' + primaria.modelo : ''}`;

      const docs = validParts.map((p) => {
        const precoNum = p.preco ? Number(p.preco) : null;
        const precoNovoNum = p.precoNovoReferencia ? Number(p.precoNovoReferencia) : null;
        return pickDefined({
          tipo: 'desmonte',
          titulo: `${p.titulo.trim()} - ${marcaModelo}`,
          categoria: p.categoria,
          estado: p.estado,
          marcaCarro: primaria.marca,
          modeloCarro: primaria.modelo || undefined,
          compatibilidades,
          precoNovoReferencia: precoNovoNum && precoNovoNum > 0 ? precoNovoNum : undefined,
          preco: precoNum,
          descricao: descricaoVeiculo || '',
          local: localizacao,
          distrito: localizacaoDistrito || undefined,
          coordenadas: coords,
          bulkLoteId: loteId,
          criador: user?.email || '',
          criadorUid: user?.uid || '',
          vendedorNome: user?.nome || 'Anónimo',
          vendedorTelefone: vendedorWhatsApp || null,
          vendedorWhatsApp: vendedorWhatsApp || null,
          vendedorEmail: user?.email || null,
        });
      });

      await addPecasBatch(docs);

      const admins = await getAdminUsers();
      admins.forEach((a) => {
        criarNotificacao(
          a.uid,
          'info',
          'Novo lote de desmonte',
          `${validParts.length} peças publicadas para ${primaria.marca} ${primaria.modelo || ''}.`,
          `/pecas`,
        );
      });

      reset();
      onClose();
    } catch (err) {
      console.error('[Desmanchar] Erro:', err);
      setErro('Erro ao publicar peças. Tente novamente.');
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onClose={close} titulo="Desmanchar Carro - Publicar Lote de Peças" tamanho="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className={`flex items-center gap-1 ${step === 1 ? 'text-accent' : ''}`}>
            <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-[10px] ${step === 1 ? 'bg-accent' : 'bg-slate-300'}`}>1</span>
            Veículo
          </span>
          <span className="flex-1 h-px bg-slate-200"></span>
          <span className={`flex items-center gap-1 ${step === 2 ? 'text-accent' : ''}`}>
            <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-[10px] ${step === 2 ? 'bg-accent' : 'bg-slate-300'}`}>2</span>
            Peças
          </span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <CompatibilitySelector value={compatibilidades} onChange={setCompatibilidades} required maxEntries={5} />

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Notas sobre o veículo (opcional)</label>
              <textarea
                rows={3}
                placeholder="Estado geral, quilometragem, motor, etc."
                value={descricaoVeiculo}
                onChange={(e) => setDescricaoVeiculo(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Localização</label>
              <SeletorLocalizacao
                distrito={localizacaoDistrito}
                concelho={localizacao}
                onChange={(d, c) => { setLocalizacaoDistrito(d); setLocalizacao(c); }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">WhatsApp / Telefone</label>
              <input
                type="tel"
                placeholder="912345678"
                value={vendedorWhatsApp}
                onChange={(e) => setVendedorWhatsApp(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {erro && <p className="text-xs text-red-500 font-semibold">{erro}</p>}

            <div className="flex gap-3">
              <button
                onClick={close}
                className="flex-1 bg-white hover:bg-slate-50 text-brand-700 font-semibold py-2.5 rounded-xl transition border border-slate-300 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={nextStep}
                className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-xl transition text-sm"
              >
                Próximo: Peças <i className="fa-solid fa-arrow-right ml-1"></i>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
              <i className="fa-solid fa-circle-info mr-1"></i>
              Cada peça abaixo será publicada como anúncio individual de desmonte, todos ligados ao mesmo veículo.
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Sugestões rápidas:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PARTS.map((s) => (
                  <button
                    key={s.titulo}
                    type="button"
                    onClick={() => addPart(s.titulo, s.categoria)}
                    className="text-[11px] font-semibold bg-slate-100 hover:bg-accent hover:text-white border border-slate-200 rounded-full px-2.5 py-1 transition"
                  >
                    + {s.titulo}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {parts.map((p, idx) => (
                <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">Peça #{idx + 1}</span>
                    {parts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePart(p.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold"
                      >
                        <i className="fa-solid fa-trash"></i> Remover
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Título (ex: Farol esquerdo)"
                      value={p.titulo}
                      onChange={(e) => updatePart(p.id, 'titulo', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent sm:col-span-2"
                    />
                    <select
                      value={p.categoria}
                      onChange={(e) => updatePart(p.id, 'categoria', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
                    >
                      {CATEGORIAS_PECAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={p.estado}
                      onChange={(e) => updatePart(p.id, 'estado', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
                    >
                      {ESTADOS_PECA.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Preço (€)"
                      value={p.preco}
                      onChange={(e) => updatePart(p.id, 'preco', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      placeholder="Preço novo ref. (€)"
                      value={p.precoNovoReferencia}
                      onChange={(e) => updatePart(p.id, 'precoNovoReferencia', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addPart()}
              className="w-full bg-white hover:bg-slate-50 text-brand-700 border-2 border-dashed border-slate-300 hover:border-accent rounded-xl py-2 text-xs font-semibold transition"
            >
              <i className="fa-solid fa-plus mr-1"></i> Adicionar peça manualmente
            </button>

            {erro && <p className="text-xs text-red-500 font-semibold">{erro}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={submitting}
                className="flex-1 bg-white hover:bg-slate-50 text-brand-700 font-semibold py-2.5 rounded-xl transition border border-slate-300 text-sm disabled:opacity-50"
              >
                <i className="fa-solid fa-arrow-left mr-1"></i> Voltar
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-1"></i> A publicar...</>
                ) : (
                  <><i className="fa-solid fa-circle-plus mr-1"></i> Publicar {parts.filter((p) => p.titulo.trim()).length} peças</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
