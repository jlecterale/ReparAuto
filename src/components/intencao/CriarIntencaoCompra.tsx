'use client';

import { Check, CheckCircle } from '@phosphor-icons/react';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { gerarTituloIntencao, validarIntencaoCompra } from '@/lib/utils';
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
            onClick={() => { setSucesso(false); setForm(formInicial); setPasso(1); setAceiteTermos(false); }}
          >
            Nova intenção
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-fg-heading mb-1">Criar Intenção de Compra</h2>
        <p className="text-xs text-fg-subtle">Descreva o carro que procura e receba ofertas de vendedores.</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 text-xs font-bold">
          <span className="text-accent">Passo {passo} de {STEPS.length}</span>
          <span className="text-fg-muted">{STEPS[passo - 1]}</span>
        </div>
        <div className="flex items-center" aria-hidden="true">
          {STEPS.map((label, i) => {
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
                {i < STEPS.length - 1 && (
                  <div className={`h-1 flex-1 mx-1.5 rounded-full transition-colors ${done ? 'bg-success-500' : 'bg-slate-200'}`} />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        {passo === 1 && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">O que você procura?</h3>
            <StepBasico criterios={form.criterios} onChange={updateForm} />
          </>
        )}
        {passo === 2 && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Orçamento</h3>
            <StepPrecoCombustivel criterios={form.criterios} onChange={updateForm} />
          </>
        )}
        {passo === 3 && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Onde e até onde?</h3>
            <StepLocalizacao criterios={form.criterios} onChange={updateForm} />
          </>
        )}
        {passo === 4 && (
          <>
            <h3 className="font-extrabold text-fg-heading mb-4">Preferências adicionais</h3>
            <p className="text-xs text-fg-subtle mb-4">(Opcional)</p>
            <StepPreferencias preferencias={form.preferencias || {}} onChange={updateForm} />
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

        <div className="flex justify-between mt-6 pt-4 border-t border-slate-200">
          <Button
            tipo="terciario"
            onClick={() => setPasso(Math.max(1, passo - 1))}
            disabled={passo === 1}
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
    </div>
  );
}
