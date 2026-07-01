'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import { updatePremiumConfig, getLeadsParceriaAdmin } from '@/lib/db';
import { useToast } from '@/components/ui/Toast';
import { Coins, ShieldCheck, Handshake, CircleNotch, Power, Calendar, User, Phone, Envelope } from '@phosphor-icons/react';
import { formatarDataHora } from '@/lib/utils';
import type { LeadParceria } from '@/types/lead';
import Button from '@/components/ui/Button';

export default function SeguroFinanciamentoTab() {
  const { premiumConfig, auth } = useApp();
  const toast = useToast();
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadParceria[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [leadFilter, setLeadFilter] = useState<'todas' | 'financiamento' | 'seguro'>('todas');

  const isMasterActive = premiumConfig.masterActive !== false;
  const isParceriasActive = premiumConfig.parceriasActive !== false;
  const isFinanciamentoActive = premiumConfig.financiamento !== false;
  const isSeguroActive = premiumConfig.seguro !== false;

  useEffect(() => {
    async function carregarLeads() {
      setLoadingLeads(true);
      try {
        const data = await getLeadsParceriaAdmin();
        setLeads(data);
      } catch (err) {
        console.error(err);
        toast?.erro('Erro ao carregar leads de parcerias.');
      } finally {
        setLoadingLeads(false);
      }
    }
    carregarLeads();
  }, [toast]);

  const handleToggle = async (
    feature: 'parceriasActive' | 'financiamento' | 'seguro',
    currentValue: boolean
  ) => {
    if (!auth.user) return;
    setLoadingFeature(feature);
    try {
      await updatePremiumConfig({ [feature]: !currentValue }, auth.user.uid);
      const featureLabels = {
        parceriasActive: 'Chave Geral de Adicionais',
        financiamento: 'Simulador de Financiamento',
        seguro: 'Simulador de Seguro Auto',
      };
      toast?.sucesso(`Módulo "${featureLabels[feature]}" atualizado com sucesso!`);
    } catch (err) {
      console.error(err);
      toast?.erro(`Erro ao atualizar o módulo "${feature}".`);
    } finally {
      setLoadingFeature(null);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (leadFilter === 'todas') return true;
    return l.tipo === leadFilter;
  });

  return (
    <div className="space-y-8 text-fg">
      
      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Master Toggle Card */}
        <div className={`p-6 rounded-2xl border transition-all duration-300 lg:col-span-3 ${
          isParceriasActive && isMasterActive
            ? 'border-emerald-200 bg-emerald-50 shadow-sm'
            : 'border-neutral-200 bg-white/30 opacity-70'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-xl shrink-0 transition-all duration-300 ${
                isParceriasActive && isMasterActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'bg-slate-100 text-fg-muted'
              }`}>
                <Handshake className="text-2xl shrink-0" weight="bold" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-fg-heading">Chave Geral de Adicionais (Financiamento e Seguro)</h3>
                <p className="text-xs text-fg-muted mt-1 leading-relaxed max-w-xl">
                  Ativa ou desativa simultaneamente todos os adicionais e simuladores de parcerias (Seguro Auto e Financiamento) exibidos nas páginas de detalhes dos veículos de forma imediata.
                </p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 ${
                  isParceriasActive && isMasterActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-800/40' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {isParceriasActive && isMasterActive ? 'Simuladores Ativos na Plataforma' : 'Todos os Simuladores Desativados'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-bold text-fg-muted">
                {isParceriasActive && isMasterActive ? 'Ativo' : 'Inativo'}
              </span>
              <button
                disabled={!isMasterActive || loadingFeature === 'parceriasActive'}
                onClick={() => handleToggle('parceriasActive', isParceriasActive)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 ${
                  isParceriasActive && isMasterActive ? 'bg-emerald-600' : 'bg-slate-100'
                }`}
              >
                {loadingFeature === 'parceriasActive' ? (
                  <span className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isParceriasActive ? 'translate-x-5' : 'translate-x-0'
                  }`}>
                    <CircleNotch className="animate-spin text-[10px] text-fg-muted" />
                  </span>
                ) : (
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isParceriasActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Individual Toggles */}
        <div className={`p-5 bg-white border rounded-2xl shadow-sm transition-all duration-300 flex flex-col justify-between ${
          isFinanciamentoActive && isParceriasActive && isMasterActive ? 'border-neutral-200' : 'border-neutral-200 opacity-55'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                isMasterActive && isParceriasActive ? 'bg-amber-600/10 text-amber-700' : 'text-fg-muted bg-slate-100'
              }`}>
                <Coins className="text-xl shrink-0" weight="fill" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-fg-heading">Simulador de Financiamento</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  isFinanciamentoActive && isParceriasActive && isMasterActive 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {isFinanciamentoActive && isParceriasActive && isMasterActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <p className="text-xs text-fg-muted leading-relaxed">
              Disponibiliza o simulador de crédito na ficha dos carros e recolhe as intenções de crédito.
            </p>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
            <span className="text-xs font-semibold text-fg-muted">Estado</span>
            <button
              disabled={!isMasterActive || !isParceriasActive || loadingFeature === 'financiamento'}
              onClick={() => handleToggle('financiamento', isFinanciamentoActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 ${
                isFinanciamentoActive && isParceriasActive && isMasterActive ? 'bg-amber-600' : 'bg-slate-100'
              }`}
            >
              {loadingFeature === 'financiamento' ? (
                <span className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isFinanciamentoActive ? 'translate-x-5' : 'translate-x-0'
                }`}>
                  <CircleNotch className="animate-spin text-[10px] text-fg-muted" />
                </span>
              ) : (
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isFinanciamentoActive ? 'translate-x-5' : 'translate-x-0'
                }`} />
              )}
            </button>
          </div>
        </div>

        <div className={`p-5 bg-white border rounded-2xl shadow-sm transition-all duration-300 flex flex-col justify-between ${
          isSeguroActive && isParceriasActive && isMasterActive ? 'border-neutral-200' : 'border-neutral-200 opacity-55'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                isMasterActive && isParceriasActive ? 'bg-blue-600/10 text-blue-700' : 'text-fg-muted bg-slate-100'
              }`}>
                <ShieldCheck className="text-xl shrink-0" weight="fill" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-fg-heading">Simulador de Seguro Auto</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  isSeguroActive && isParceriasActive && isMasterActive 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {isSeguroActive && isParceriasActive && isMasterActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <p className="text-xs text-fg-muted leading-relaxed">
              Disponibiliza o simulador de seguro automóvel na ficha dos carros e recolhe propostas de cotação.
            </p>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
            <span className="text-xs font-semibold text-fg-muted">Estado</span>
            <button
              disabled={!isMasterActive || !isParceriasActive || loadingFeature === 'seguro'}
              onClick={() => handleToggle('seguro', isSeguroActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 ${
                isSeguroActive && isParceriasActive && isMasterActive ? 'bg-blue-600' : 'bg-slate-100'
              }`}
            >
              {loadingFeature === 'seguro' ? (
                <span className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isSeguroActive ? 'translate-x-5' : 'translate-x-0'
                }`}>
                  <CircleNotch className="animate-spin text-[10px] text-fg-muted" />
                </span>
              ) : (
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isSeguroActive ? 'translate-x-5' : 'translate-x-0'
                }`} />
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Leads Table Container */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-fg-heading flex items-center gap-2">
              <Coins className="text-pink-700" /> Leads de Parcerias Registadas
            </h2>
            <p className="text-xs text-fg-muted mt-0.5">Leads qualificadas geradas a partir dos simuladores de Seguro e Crédito.</p>
          </div>

          <div className="flex bg-neutral-50 p-1 rounded-xl border border-neutral-200 gap-1 self-start sm:self-center">
            {(['todas', 'financiamento', 'seguro'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLeadFilter(filter)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                  leadFilter === filter
                    ? 'bg-slate-100 text-pink-700 shadow-sm'
                    : 'text-fg-muted hover:text-fg-strong'
                }`}
              >
                {filter === 'todas' ? 'Todas' : filter === 'financiamento' ? 'Financiamentos' : 'Seguros'}
              </button>
            ))}
          </div>
        </div>

        {loadingLeads ? (
          <div className="flex justify-center items-center py-12">
            <CircleNotch className="animate-spin text-2xl text-pink-700" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <p className="text-sm text-fg-muted py-10 text-center">Nenhuma lead registada para o filtro selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs font-bold text-fg-muted uppercase border-b border-neutral-200 pb-3">
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Contactos</th>
                  <th className="pb-3 pr-4">Tipo</th>
                  <th className="pb-3 pr-4">Veículo Associado</th>
                  <th className="pb-3 pr-4">Simulação Detalhada</th>
                  <th className="pb-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-neutral-200 hover:bg-slate-100/20 transition-all">
                    {/* User info */}
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-fg-heading flex items-center gap-1.5">
                        <User size={14} className="text-fg-muted" /> {lead.nome}
                      </div>
                    </td>
                    
                    {/* Contact info */}
                    <td className="py-3.5 pr-4 text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 text-fg">
                        <Phone size={12} className="text-fg-muted" /> {lead.telefone}
                      </div>
                      <div className="flex items-center gap-1.5 text-fg-muted">
                        <Envelope size={12} className="text-fg-muted" /> {lead.email}
                      </div>
                    </td>
                    
                    {/* Type badge */}
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        lead.tipo === 'financiamento'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {lead.tipo === 'financiamento' ? <Coins size={10} /> : <ShieldCheck size={10} />}
                        {lead.tipo === 'financiamento' ? 'Financiamento' : 'Seguro Auto'}
                      </span>
                    </td>

                    {/* Listing context */}
                    <td className="py-3.5 pr-4 text-xs max-w-[200px] truncate">
                      {lead.carroTitulo ? (
                        <div>
                          <p className="font-semibold text-fg-strong truncate">{lead.carroTitulo}</p>
                          <p className="text-[10px] text-fg-muted">{lead.carroPreco?.toLocaleString('pt-PT')}€</p>
                        </div>
                      ) : (
                        <span className="text-fg-muted">—</span>
                      )}
                    </td>

                    {/* Simulation details */}
                    <td className="py-3.5 pr-4 text-xs">
                      {lead.tipo === 'financiamento' ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-amber-700">
                            Prestação: {lead.prestacaoEstimada}€ <span className="text-[10px] text-fg-muted">/mês</span>
                          </p>
                          <p className="text-[10px] text-fg-muted">
                            Entrada: {lead.entrada?.toLocaleString('pt-PT')}€ • Prazo: {lead.meses} meses
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="font-bold text-blue-700">
                            Prémio Est.: ~{lead.premioEstimado}€ <span className="text-[10px] text-fg-muted">/ano</span>
                          </p>
                          <p className="text-[10px] text-fg-muted">
                            Idade: {lead.idadeCondutor} anos • Cobertura: {lead.cobertura === 'danos' ? 'Danos Próprios' : 'Terceiros'}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-xs text-fg-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-fg-muted" />
                        {lead.criadaEm ? formatarDataHora(lead.criadaEm) : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
