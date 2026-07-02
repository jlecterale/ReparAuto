'use client';

import { Check, CheckCircle } from '@phosphor-icons/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import DraftResumePrompt from '@/components/ui/DraftResumePrompt';
import { gerarTituloIntencao, validarIntencaoCompra } from '@/lib/utils';
import { CATEGORIAS_INTENCAO } from '@/lib/constants';
import { getAdminUsers, criarNotificacao } from '@/lib/db';
import { saveAdDraft, loadAdDraft, clearAdDraft, hasIntentDraftContent, type AdDraft } from '@/lib/adDraft';
import type { CategoriaIntencao } from '@/types/intencao';
import StepCategoria from './StepCategoria';
import StepBasico from './StepBasico';
import StepPrecoCombustivel from './StepPrecoCombustivel';
import StepLocalizacao from './StepLocalizacao';
import StepPreferencias from './StepPreferencias';
import StepContato from './StepContato';
import StepResumo from './StepResumo';

const STEPS = ['Categoria', 'Básico', 'Orçamento', 'Localização', 'Preferências', 'Contacto', 'Resumo'];

export interface FormState {
  categoria: CategoriaIntencao | null;
  criterios: {
    marca: string;
    modelo: string;
    anoMinimo: number;
    anoMaximo?: number;
    precoMinimo?: number;
    precoMaximo: number;
    combustivel: string[];
    tipoTransmissao: string[];
    quilometragemMaxima: number;
    localizacao: {
      distrito: string;
      raio: number;
    };
  };
  preferencias?: {
    cores?: string[];
    tipoCarroceria?: string[];
    itensDesejados?: string[];
    aceitaFinanciamento?: boolean;
    aceitaTroca?: boolean;
  };
  contatoPreferido: 'chat' | 'whatsapp' | 'ambos';
  mostrarTelefone: boolean;
  descricao: string;
}

/** Serializable snapshot persisted as the purchase-intent draft. */
export interface IntencaoFormDraft {
  form: FormState;
  passo: number;
}

const formInicial: FormState = {
  categoria: null,
  criterios: {
    marca: '',
    modelo: '',
    anoMinimo: 2000,
    anoMaximo: undefined,
    precoMinimo: undefined,
    precoMaximo: 5000,
    combustivel: [],
    tipoTransmissao: [],
    quilometragemMaxima: 200000,
    localizacao: { distrito: '', raio: 50 },
  },
  preferencias: {},
  contatoPreferido: 'chat',
  mostrarTelefone: false,
  descricao: '',
};

export default function CriarIntencaoCompra() {
  const [passo, setPasso] = useState(0);
  const [form, setForm] = useState<FormState>(formInicial);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const { intencoes, auth } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  // The profile's "Continuar rascunho" button deep-links with ?retomar=1 to
  // resume the saved draft directly, without re-asking.
  const retomarParam = searchParams.get('retomar') === '1';

  const [draftPrompt, setDraftPrompt] = useState<AdDraft<IntencaoFormDraft> | null>(null);
  const draftHandledRef = useRef(false);

  const applyDraft = (d: IntencaoFormDraft) => {
    setForm({
      ...formInicial,
      ...d.form,
      criterios: {
        ...formInicial.criterios,
        ...d.form?.criterios,
        localizacao: { ...formInicial.criterios.localizacao, ...d.form?.criterios?.localizacao },
      },
    });
    setPasso(Math.min(Math.max(d.passo ?? 0, 0), STEPS.length - 1));
  };

  // Offer to resume a saved draft. Re-runs when auth resolves, because an
  // owned draft is invisible until the uid is known.
  useEffect(() => {
    if (sucesso || draftHandledRef.current) return;
    const draft = loadAdDraft<IntencaoFormDraft>('intencao', auth.user?.uid ?? null);
    if (!draft) return;
    // Never clobber progress the user already made in this visit.
    if (hasIntentDraftContent(form)) return;
    draftHandledRef.current = true;
    if (retomarParam) {
      applyDraft(draft.data);
    } else {
      setDraftPrompt(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.uid, sucesso]);

  // Autosave the draft (debounced) whenever the wizard holds real progress.
  useEffect(() => {
    if (sucesso || publicando || draftPrompt || !hasIntentDraftContent(form)) return;
    const timer = setTimeout(() => {
      saveAdDraft<IntencaoFormDraft>('intencao', { form, passo }, { uid: auth.user?.uid ?? null });
    }, 500);
    return () => clearTimeout(timer);
  }, [form, passo, sucesso, publicando, draftPrompt, auth.user?.uid]);

  const updateForm = (field: string, value: any) => {
    const keys = field.split('.');
    setForm((prev) => {
      const novo = { ...prev };
      let obj: any = novo;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return novo;
    });
  };

  const isVeiculo = form.categoria === 'carro' || form.categoria === 'moto' || form.categoria === 'viatura_comercial';

  const podeAvancar = (): boolean => {
    const c = form.criterios;
    switch (passo) {
      case 0: return !!form.categoria;
      case 1: {
        if (form.categoria === 'pecas') return !!form.descricao?.trim();
        return !!c.marca && !!c.modelo && !!c.anoMinimo;
      }
      case 2: {
        if (!c.precoMaximo) return false;
        if (isVeiculo) return c.combustivel.length > 0 && c.tipoTransmissao.length > 0;
        return true;
      }
      case 3: return !!c.localizacao.distrito;
      case 4: return true;
      case 5: return !!form.contatoPreferido;
      case 6: return aceiteTermos;
      default: return false;
    }
  };

  const handlePublicar = async () => {
    if (!auth.user?.uid) {
      toast?.erro('Faça login para publicar uma intenção.');
      return;
    }
    const validacao = validarIntencaoCompra(form);
    if (!validacao.valido) {
      toast?.erro(validacao.erros[0]);
      return;
    }
    if ((form.contatoPreferido === 'whatsapp' || form.contatoPreferido === 'ambos') && !auth.user.telefone) {
      toast?.info('Adicione um telefone no seu perfil para ser contactado por WhatsApp.');
    }
    setPublicando(true);
    try {
      const titulo = gerarTituloIntencao({
        categoria: form.categoria || undefined,
        criterios: form.criterios,
        descricao: form.descricao,
      });
      const dados: Record<string, any> = {
        userId: auth.user.uid,
        categoria: form.categoria,
        titulo,
        criterios: {
          ...form.criterios,
          localizacao: { ...form.criterios.localizacao },
        },
        contatoPreferido: form.contatoPreferido,
        mostrarTelefone: form.mostrarTelefone,
        vendedorNome: auth.user.nome,
        vendedorEmail: auth.user.email,
        vendedorTelefone: auth.user.telefone?.replace(/\s/g, '') || null,
        vendedorWhatsApp: auth.user.telefone?.replace(/\s/g, '') || null,
        prioritaria: false,
      };
      if (form.descricao) dados.descricao = form.descricao;
      if (form.preferencias && Object.keys(form.preferencias).length > 0) dados.preferencias = form.preferencias;
      const intencaoId = await intencoes.criarIntencao(dados as any);
      const admins = await getAdminUsers();
      admins.forEach((a) => {
        criarNotificacao(a.uid, 'info', 'Nova intenção pendente',
          `Uma nova intenção de compra foi publicada: ${titulo}.`,
          `/admin`);
      });
      clearAdDraft('intencao');
      setSucesso(true);
      toast?.sucesso('Intenção de compra publicada com sucesso!');
    } catch (err: any) {
      toast?.erro(err.message || 'Erro ao publicar intenção.');
    } finally {
      setPublicando(false);
    }
  };

  if (sucesso) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="text-5xl text-green-500 mb-4" />
        <h3 className="text-xl font-extrabold text-fg-heading mb-2">Intenção Publicada!</h3>
        <p className="text-sm text-fg-subtle mb-6">Vendedores podem agora ver a sua intenção e entrar em contacto.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            tipo="primario"
            onClick={() => router.push('/minhas-intencoes')}
          >
            Ver minhas intenções
          </Button>
          <Button
            tipo="secundario"
            onClick={() => { setSucesso(false); setForm(formInicial); setPasso(0); setAceiteTermos(false); }}
          >
            Nova intenção
          </Button>
        </div>
      </div>
    );
  }

  const catLabel = form.categoria
    ? CATEGORIAS_INTENCAO.find(c => c.value === form.categoria)?.label
    : null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-fg-heading mb-1">
          {passo === 0 ? 'Criar Intenção de Compra' : `Nova Intenção${catLabel ? ` — ${catLabel}` : ''}`}
        </h2>
        <p className="text-xs text-fg-subtle">
          {passo === 0
            ? 'Escolha o que procura e receba ofertas de vendedores.'
            : form.categoria === 'pecas'
              ? 'Descreva a peça que precisa e receba propostas de quem tem.'
              : 'Descreva o veículo que procura e receba ofertas de vendedores.'}
        </p>
      </div>

      {passo > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-xs font-bold">
            <span className="text-accent">Passo {passo} de {STEPS.length - 1}</span>
            <span className="text-fg-muted">{STEPS[passo]}</span>
          </div>
          <div className="flex items-center" aria-hidden="true">
            {STEPS.slice(1).map((label, i) => {
              const num = i + 1;
              const done = num < passo;
              const active = num === passo;
              return (
                <Fragment key={label}>
                  <div
                    title={label}
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors ${
                      done
                        ? 'bg-success-500 text-white'
                        : active
                          ? 'bg-accent text-white ring-4 ring-accent/20'
                          : 'bg-slate-200 text-fg-subtle'
                    }`}
                  >
                    {done ? <Check weight="bold" /> : num}
                  </div>
                  {i < STEPS.slice(1).length - 1 && (
                    <div className={`h-1 flex-1 mx-1.5 rounded-full transition-colors ${done ? 'bg-success-500' : 'bg-slate-200'}`} />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6">
        {passo === 0 && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">O que procura?</h3>
            <StepCategoria
              value={form.categoria}
              onChange={(cat) => { updateForm('categoria', cat); }}
            />
          </>
        )}
        {passo === 1 && isVeiculo && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Detalhes do veículo</h3>
            <StepBasico criterios={form.criterios} onChange={updateForm} categoria={form.categoria} />
          </>
        )}
        {passo === 1 && form.categoria === 'pecas' && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Descreva a peça</h3>
            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">
                Descrição da peça <span className="text-accent">*</span>
              </label>
              <textarea
                value={form.descricao}
                onChange={(e) => updateForm('descricao', e.target.value)}
                placeholder="Ex: Farol dianteiro direito para Renault Clio 2015, motor 1.5 dCi"
                maxLength={500}
                rows={4}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-fg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition resize-none"
              />
              <p className="text-xs text-fg-subtle mt-1 text-right">{form.descricao.length}/500</p>
            </div>
          </>
        )}
        {passo === 2 && isVeiculo && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Orçamento</h3>
            <StepPrecoCombustivel criterios={form.criterios} onChange={updateForm} />
          </>
        )}
        {passo === 2 && form.categoria === 'pecas' && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Orçamento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-fg-subtle mb-1">Preço mínimo (€)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.criterios.precoMinimo ?? ''}
                  onChange={(e) => updateForm('criterios.precoMinimo', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-fg-subtle mb-1">Preço máximo * (€)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Ex: 500"
                  value={form.criterios.precoMaximo || ''}
                  onChange={(e) => updateForm('criterios.precoMaximo', Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </>
        )}
        {passo === 3 && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Onde e até onde?</h3>
            <StepLocalizacao criterios={form.criterios} onChange={updateForm} />
          </>
        )}
        {passo === 4 && isVeiculo && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Preferências adicionais</h3>
            <p className="text-xs text-fg-subtle mb-4">(Opcional)</p>
            <StepPreferencias preferencias={form.preferencias || {}} onChange={updateForm} />
          </>
        )}
        {passo === 4 && form.categoria === 'pecas' && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Detalhes adicionais</h3>
            <p className="text-xs text-fg-subtle mb-4">(Opcional)</p>
            <div>
              <label className="block text-xs font-bold text-fg-subtle mb-1">Informação extra</label>
              <textarea
                value={form.descricao}
                onChange={(e) => updateForm('descricao', e.target.value)}
                placeholder="Ex: Estado de conservação, compatibilidade, urgência..."
                maxLength={500}
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-fg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition resize-none"
              />
              <p className="text-xs text-fg-subtle mt-1 text-right">{form.descricao.length}/500</p>
            </div>
          </>
        )}
        {passo === 5 && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Como prefere ser contactado?</h3>
            <StepContato
              contatoPreferido={form.contatoPreferido}
              mostrarTelefone={form.mostrarTelefone}
              descricao={form.descricao}
              onChange={updateForm}
            />
          </>
        )}
        {passo === 6 && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Confirmar Intenção</h3>
            <StepResumo
              form={form}
              aceiteTermos={aceiteTermos}
              onToggleTermos={() => setAceiteTermos(!aceiteTermos)}
            />
          </>
        )}

        {passo > 0 && (
          <p className="text-[11px] text-fg-muted mt-6">
            💾 O progresso é guardado automaticamente como rascunho neste dispositivo.
          </p>
        )}
        <div className={`flex justify-between pt-4 border-t border-slate-200 ${passo > 0 ? 'mt-2' : 'mt-6'}`}>
          <Button
            tipo="terciario"
            onClick={() => setPasso(Math.max(0, passo - 1))}
            disabled={passo === 0}
          >
            ← Anterior
          </Button>
          {passo < 6 ? (
            <Button
              tipo="primario"
              onClick={() => setPasso(passo + 1)}
              disabled={!podeAvancar()}
            >
              Próximo →
            </Button>
          ) : (
            <Button
              tipo="verde"
              onClick={handlePublicar}
              disabled={!podeAvancar()}
              carregando={publicando}
              icone={<Check />}
            >
              Publicar Intenção
            </Button>
          )}
        </div>
      </div>

      {draftPrompt && (
        <DraftResumePrompt
          itemLabel="uma intenção de compra"
          savedAt={draftPrompt.savedAt}
          onDiscard={() => {
            clearAdDraft('intencao');
            setDraftPrompt(null);
          }}
          onResume={() => {
            applyDraft(draftPrompt.data);
            setDraftPrompt(null);
          }}
        />
      )}
    </div>
  );
}
