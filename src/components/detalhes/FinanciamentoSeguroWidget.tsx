'use client';

import { useState } from 'react';
import { Coins, ShieldCheck, Calculator, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { criarLeadParceria } from '@/lib/db';

interface FinanciamentoSeguroWidgetProps {
  carroPreco: number;
  carroId?: string;
  carroTitulo?: string;
  defaultNome?: string;
  defaultEmail?: string;
  defaultTelefone?: string;
}

export default function FinanciamentoSeguroWidget({
  carroPreco,
  carroId,
  carroTitulo,
  defaultNome = '',
  defaultEmail = '',
  defaultTelefone = '',
}: FinanciamentoSeguroWidgetProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'financiamento' | 'seguro'>('financiamento');

  // Shared contact + consent (RGPD)
  const [nome, setNome] = useState(defaultNome);
  const [email, setEmail] = useState(defaultEmail);
  const [telefone, setTelefone] = useState(defaultTelefone);
  const [consentimento, setConsentimento] = useState(false);

  // States for Credit Simulator
  const [entrada, setEntrada] = useState<number>(Math.round(carroPreco * 0.2));
  const [meses, setMeses] = useState<number>(48);
  const [leadEnviadaCredito, setLeadEnviadaCredito] = useState(false);
  const [loadingCredito, setLoadingCredito] = useState(false);

  // States for Insurance Simulator
  const [idade, setIdade] = useState<number>(30);
  const [cobertura, setCobertura] = useState<'civil' | 'danos'>('civil');
  const [leadEnviadaSeguro, setLeadEnviadaSeguro] = useState(false);
  const [loadingSeguro, setLoadingSeguro] = useState(false);

  const valorFinanciado = Math.max(0, carroPreco - entrada);
  const taxaAnual = 0.065; // 6.5% nominal annual rate (TAN) — indicative
  const taxaMensal = taxaAnual / 12;
  const prestacaoMensal = valorFinanciado > 0
    ? Math.round((valorFinanciado * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -meses)))
    : 0;

  const precoSeguroEstimado = cobertura === 'civil' ? 180 : 450;

  function validarContacto(): boolean {
    if (!nome.trim()) {
      toast?.erro('Indique o seu nome.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast?.erro('Indique um e-mail válido.');
      return false;
    }
    if (telefone.replace(/\D/g, '').length < 9) {
      toast?.erro('Indique um telefone válido.');
      return false;
    }
    if (!consentimento) {
      toast?.erro('É necessário o seu consentimento para partilhar os dados com os parceiros.');
      return false;
    }
    return true;
  }

  const handleSimularCredito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarContacto()) return;
    setLoadingCredito(true);
    try {
      await criarLeadParceria({
        tipo: 'financiamento',
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        consentimento: true,
        origem: 'detalhes-carro',
        carroId,
        carroTitulo,
        carroPreco,
        entrada,
        meses,
        prestacaoEstimada: prestacaoMensal,
      });
      setLeadEnviadaCredito(true);
    } catch {
      toast?.erro('Não foi possível enviar o pedido. Tente novamente.');
    } finally {
      setLoadingCredito(false);
    }
  };

  const handleSimularSeguro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarContacto()) return;
    setLoadingSeguro(true);
    try {
      await criarLeadParceria({
        tipo: 'seguro',
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        consentimento: true,
        origem: 'detalhes-carro',
        carroId,
        carroTitulo,
        carroPreco,
        idadeCondutor: idade,
        cobertura,
        premioEstimado: precoSeguroEstimado,
      });
      setLeadEnviadaSeguro(true);
    } catch {
      toast?.erro('Não foi possível enviar o pedido. Tente novamente.');
    } finally {
      setLoadingSeguro(false);
    }
  };

  // Shared contact + consent block (rendered inside each form)
  const contactoConsentimento = (
    <div className="space-y-2 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
          autoComplete="name"
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
        />
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="Telefone"
          autoComplete="tel"
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
        />
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail"
        autoComplete="email"
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
      />
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consentimento}
          onChange={(e) => setConsentimento(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-accent focus:ring-accent/30"
        />
        <span className="text-[10px] text-fg-subtle leading-relaxed">
          Autorizo a partilha dos meus dados de contacto com os parceiros de crédito e seguro da ReparAuto
          para receber propostas, nos termos da Política de Privacidade (RGPD).
        </span>
      </label>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm mt-4">
      {/* Tabs header */}
      <div className="flex border-b border-slate-100 pb-3 mb-4">
        <button
          onClick={() => setActiveTab('financiamento')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-1 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'financiamento'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-subtle hover:text-fg'
          }`}
        >
          <Coins size={18} />
          Financiamento
        </button>
        <button
          onClick={() => setActiveTab('seguro')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-1 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'seguro'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-subtle hover:text-fg'
          }`}
        >
          <ShieldCheck size={18} />
          Seguro Auto
        </button>
      </div>

      {/* Financiamento Tab */}
      {activeTab === 'financiamento' && (
        <div>
          {leadEnviadaCredito ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" weight="fill" />
              <h4 className="font-extrabold text-fg-heading text-base">Pedido de Simulação Registado!</h4>
              <p className="text-xs text-fg-subtle mt-1 px-4">
                Os nossos parceiros de crédito automóvel vão analisar o seu pedido e entrar em contacto consigo.
              </p>
              <Button
                tipo="terciario"
                tamanho="sm"
                className="mt-4"
                onClick={() => setLeadEnviadaCredito(false)}
              >
                Nova Simulação
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSimularCredito} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs text-fg-subtle block">Prestação Mensal Estimada</span>
                  <span className="text-2xl font-black text-accent">{prestacaoMensal}€ <span className="text-xs font-normal text-fg-muted">/mês</span></span>
                </div>
                <Calculator size={32} className="text-slate-300" />
              </div>

              <div>
                <label className="text-xs font-bold text-fg-muted block mb-1">
                  Valor de Entrada: {entrada.toLocaleString('pt-PT')}€
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.round(carroPreco * 0.8)}
                  step="100"
                  value={entrada}
                  onChange={(e) => setEntrada(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-[10px] text-fg-subtle mt-1">
                  <span>0€ (Sem entrada)</span>
                  <span>Max: {(Math.round(carroPreco * 0.8)).toLocaleString('pt-PT')}€</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-fg-muted block mb-1">
                  Prazo de Reembolso: {meses} meses
                </label>
                <input
                  type="range"
                  min="12"
                  max="84"
                  step="12"
                  value={meses}
                  onChange={(e) => setMeses(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-[10px] text-fg-subtle mt-1">
                  <span>12 meses</span>
                  <span>84 meses (7 anos)</span>
                </div>
              </div>

              {contactoConsentimento}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-fg-subtle block mb-3 leading-relaxed">
                  * Taxa indicativa (TAN 6,5%/ano). A TAEG e a prestação final dependem do parceiro e da análise de crédito. Valores não vinculativos.
                </span>
                <Button
                  type="submit"
                  tipo="primario"
                  blocoCompleto
                  carregando={loadingCredito}
                  iconeFim={<ArrowRight />}
                >
                  Pedir Pré-Aprovação de Crédito
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Seguro Tab */}
      {activeTab === 'seguro' && (
        <div>
          {leadEnviadaSeguro ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" weight="fill" />
              <h4 className="font-extrabold text-fg-heading text-base">Pedido de Cotação Registado!</h4>
              <p className="text-xs text-fg-subtle mt-1 px-4">
                Vai receber propostas de seguro dos nossos parceiros no e-mail indicado.
              </p>
              <Button
                tipo="terciario"
                tamanho="sm"
                className="mt-4"
                onClick={() => setLeadEnviadaSeguro(false)}
              >
                Nova Simulação
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSimularSeguro} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs text-fg-subtle block">Seguro Estimado</span>
                  <span className="text-2xl font-black text-primary-600">~{precoSeguroEstimado}€ <span className="text-xs font-normal text-fg-muted">/ano</span></span>
                </div>
                <ShieldCheck size={32} className="text-slate-300" />
              </div>

              <div>
                <label className="text-xs font-bold text-fg-muted block mb-1">
                  Idade do Condutor: {idade} anos
                </label>
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={idade}
                  onChange={(e) => setIdade(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-fg-muted block mb-1">
                  Tipo de Cobertura
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCobertura('civil')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition ${
                      cobertura === 'civil'
                        ? 'bg-accent/10 text-accent border-accent'
                        : 'bg-white text-fg border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Terc. (Responsab. Civil)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCobertura('danos')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition ${
                      cobertura === 'danos'
                        ? 'bg-accent/10 text-accent border-accent'
                        : 'bg-white text-fg border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Danos Próprios (Contra Todos)
                  </button>
                </div>
              </div>

              {contactoConsentimento}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-fg-subtle block mb-3 leading-relaxed">
                  * Estimativa baseada no perfil padrão do condutor sem sinistros nos últimos 5 anos. Valor final sujeito a cotação do segurador.
                </span>
                <Button
                  type="submit"
                  tipo="primario"
                  blocoCompleto
                  carregando={loadingSeguro}
                  iconeFim={<ArrowRight />}
                >
                  Obter Cotações de Seguro Grátis
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
