'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { gerarTituloIntencao, validarIntencaoCompra } from '@/lib/utils';
import StepIndicator from '@/components/anunciar/StepIndicator';
import StepBasico from './StepBasico';
import StepPrecoCombustivel from './StepPrecoCombustivel';
import StepLocalizacao from './StepLocalizacao';
import StepPreferencias from './StepPreferencias';
import StepContato from './StepContato';
import StepResumo from './StepResumo';

const STEPS = ['Básico', 'Preço & Combustível', 'Localização', 'Preferências', 'Contacto', 'Resumo'];

interface FormState {
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

const formInicial: FormState = {
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
  const [passo, setPasso] = useState(1);
  const [form, setForm] = useState<FormState>(formInicial);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const { intencoes, auth } = useApp();
  const router = useRouter();
  const toast = useToast();

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

  const podeAvancar = (): boolean => {
    const c = form.criterios;
    switch (passo) {
      case 1: return !!c.marca && !!c.modelo && !!c.anoMinimo;
      case 2: return !!c.precoMaximo && c.combustivel.length > 0 && c.tipoTransmissao.length > 0;
      case 3: return !!c.localizacao.distrito && !!c.quilometragemMaxima;
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
    setPublicando(true);
    try {
      const titulo = gerarTituloIntencao(form.criterios);
      const dados: Record<string, any> = {
        userId: auth.user.uid,
        titulo,
        criterios: {
          ...form.criterios,
          localizacao: { ...form.criterios.localizacao },
        },
        contatoPreferido: form.contatoPreferido,
        mostrarTelefone: form.mostrarTelefone,
        status: 'ativa',
        prioritaria: false,
      };
      if (form.descricao) dados.descricao = form.descricao;
      if (form.preferencias && Object.keys(form.preferencias).length > 0) dados.preferencias = form.preferencias;
      await intencoes.criarIntencao(dados as any);
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
        <i className="fa-solid fa-circle-check text-5xl text-green-500 mb-4"></i>
        <h3 className="text-xl font-extrabold text-brand-900 mb-2">Intenção Publicada!</h3>
        <p className="text-sm text-slate-500 mb-6">Vendedores podem agora ver a sua intenção e entrar em contacto.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => router.push('/minhas-intencoes')}
            className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-accent-hover transition"
          >
            Ver minhas intenções
          </button>
          <button
            onClick={() => { setSucesso(false); setForm(formInicial); setPasso(1); setAceiteTermos(false); }}
            className="border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
          >
            Nova intenção
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-brand-900 mb-1">Criar Intenção de Compra</h2>
        <p className="text-xs text-slate-500">Descreva o carro que procura e receba ofertas de vendedores.</p>
      </div>

      <div className="flex items-center justify-between mb-4 text-xs font-bold text-slate-400">
        {STEPS.map((label, i) => (
          <span key={label} className={`${passo === i + 1 ? 'text-accent' : ''} ${i + 1 < passo ? 'text-green-500' : ''}`}>
            {i + 1 < passo ? '✓' : passo === i + 1 ? `● ${label}` : `○ ${label}`}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        {passo === 1 && (
          <>
            <h3 className="font-extrabold text-brand-900 mb-4">O que você procura?</h3>
            <StepBasico criterios={form.criterios} onChange={updateForm} />
          </>
        )}
        {passo === 2 && (
          <>
            <h3 className="font-extrabold text-brand-900 mb-4">Orçamento</h3>
            <StepPrecoCombustivel criterios={form.criterios} onChange={updateForm} />
          </>
        )}
        {passo === 3 && (
          <>
            <h3 className="font-extrabold text-brand-900 mb-4">Onde e até onde?</h3>
            <StepLocalizacao criterios={form.criterios} onChange={updateForm} />
          </>
        )}
        {passo === 4 && (
          <>
            <h3 className="font-extrabold text-brand-900 mb-4">Preferências adicionais</h3>
            <p className="text-xs text-slate-400 mb-4">(Opcional)</p>
            <StepPreferencias preferencias={form.preferencias || {}} onChange={updateForm} />
          </>
        )}
        {passo === 5 && (
          <>
            <h3 className="font-extrabold text-brand-900 mb-4">Como prefere ser contactado?</h3>
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
            <h3 className="font-extrabold text-brand-900 mb-4">Confirmar Intenção</h3>
            <StepResumo
              form={form}
              aceiteTermos={aceiteTermos}
              onToggleTermos={() => setAceiteTermos(!aceiteTermos)}
            />
          </>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={() => setPasso(Math.max(1, passo - 1))}
            disabled={passo === 1}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-30"
          >
            ← Anterior
          </button>
          {passo < 6 ? (
            <button
              onClick={() => setPasso(passo + 1)}
              disabled={!podeAvancar()}
              className="bg-accent text-white px-5 py-2 text-sm font-bold rounded-xl hover:bg-accent-hover transition disabled:opacity-50"
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handlePublicar}
              disabled={!podeAvancar() || publicando}
              className="bg-green-600 text-white px-5 py-2 text-sm font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {publicando ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
              Publicar Intenção
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
