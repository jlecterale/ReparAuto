'use client';

import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { updatePremiumConfig } from '@/lib/db';
import { useToast } from '@/components/ui/Toast';
import { Lightning, Wrench, Target, CircleNotch, Power, Coins, ShieldCheck, Handshake } from '@phosphor-icons/react';
import { formatarDataHora } from '@/lib/utils';

export default function PremiumTogglePanel() {
  const { premiumConfig, auth } = useApp();
  const toast = useToast();
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null);

  const isMasterActive = premiumConfig.masterActive !== false;
  const isParceriasActive = premiumConfig.parceriasActive !== false;

  const handleToggle = async (
    feature: 'masterActive' | 'impulsionamento' | 'oficinas' | 'leads' | 'parceriasActive' | 'financiamento' | 'seguro',
    currentValue: boolean
  ) => {
    if (!auth.user) return;
    setLoadingFeature(feature);
    try {
      await updatePremiumConfig({ [feature]: !currentValue }, auth.user.uid);
      const featureLabels = {
        masterActive: 'Chave Geral',
        impulsionamento: 'Impulsionamento de Anúncios',
        oficinas: 'Diretório de Oficinas',
        leads: 'Gestão de Leads',
        parceriasActive: 'Chave Geral de Adicionais',
        financiamento: 'Financiamento Automóvel',
        seguro: 'Seguro Auto',
      };
      const featureLabel = featureLabels[feature];
      toast?.sucesso(`Módulo "${featureLabel}" atualizado com sucesso!`);
    } catch (err) {
      console.error(err);
      toast?.erro(`Erro ao atualizar o módulo "${feature}".`);
    } finally {
      setLoadingFeature(null);
    }
  };

  const modules = [
    {
      key: 'impulsionamento' as const,
      title: 'Impulsionamento de Anúncios',
      description: 'Permite aos utilizadores adquirir planos de destaque para os seus anúncios de carros ou peças no topo dos resultados.',
      icon: Lightning,
      color: 'text-amber-700 bg-amber-50',
      activeColor: 'bg-amber-500',
    },
    {
      key: 'oficinas' as const,
      title: 'Diretório de Oficinas',
      description: 'Permite aos profissionais registar oficinas, e aos clientes visualizar e pesquisar oficinas no mapa.',
      icon: Wrench,
      color: 'text-blue-700 bg-blue-50',
      activeColor: 'bg-blue-500',
    },
    {
      key: 'leads' as const,
      title: 'Gestão de Leads',
      description: 'Permite que oficinas recebam leads de clientes e respondam a pedidos de orçamento e serviços.',
      icon: Target,
      color: 'text-emerald-700 bg-emerald-50',
      activeColor: 'bg-emerald-500',
    },
  ];

  const partnershipModules = [
    {
      key: 'financiamento' as const,
      title: 'Simulador de Financiamento',
      description: 'Exibe um simulador de crédito automóvel na página de detalhes de cada carro e permite aos utilizadores solicitar pré-aprovação de financiamento.',
      icon: Coins,
      color: 'text-amber-600 bg-amber-50',
      activeColor: 'bg-amber-600',
    },
    {
      key: 'seguro' as const,
      title: 'Simulador de Seguro Auto',
      description: 'Exibe um simulador de seguro automóvel na página de detalhes de cada carro e permite aos utilizadores solicitar cotações gratuitas de seguro.',
      icon: ShieldCheck,
      color: 'text-blue-600 bg-blue-50',
      activeColor: 'bg-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-fg-subtle">
        <p className="font-semibold text-fg-heading mb-1">ℹ️ Nota de Administração</p>
        Ao desativar um módulo premium ou a Chave Geral, os planos já atribuídos aos utilizadores continuarão ativos, mas as respetivas funcionalidades serão ocultadas ou desativadas globalmente para todos os utilizadores da plataforma em tempo real.
        {premiumConfig.atualizadoEm && (
          <p className="mt-2 text-[11px] text-fg-muted">
            Última alteração: <span className="font-bold text-fg-heading">{formatarDataHora(premiumConfig.atualizadoEm)}</span> por admin (ID: <span className="font-mono text-fg-heading">{premiumConfig.atualizadoPor || 'sistema'}</span>)
          </p>
        )}
      </div>

      {/* Master Toggle Card */}
      <div className={`p-6 rounded-2xl border transition-all duration-300 ${
        isMasterActive
          ? 'border-amber-200 bg-gradient-to-r from-amber-50/60 via-orange-50/20 to-white shadow-sm'
          : 'border-slate-200 bg-slate-100 opacity-90'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-xl shrink-0 transition-all duration-300 ${
              isMasterActive ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-300 text-fg-muted'
            }`}>
              <Power className="text-2xl shrink-0" weight="bold" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-fg-heading">Chave Geral de Serviços Premium</h3>
              <p className="text-xs text-fg-subtle mt-1 leading-relaxed max-w-xl">
                Ativa ou desativa completamente todos os serviços premium da plataforma ReparAuto. 
                Quando desligado, todas as funcionalidades premium e tabelas de planos serão totalmente ocultadas para os utilizadores.
              </p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 ${
                isMasterActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isMasterActive ? 'Todos os Serviços Premium Disponíveis' : 'Todos os Serviços Premium Suspensos'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-bold text-fg-muted">
              {isMasterActive ? 'Ativo' : 'Inativo'}
            </span>
            <button
              disabled={loadingFeature === 'masterActive'}
              onClick={() => handleToggle('masterActive', isMasterActive)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 ${
                isMasterActive ? 'bg-amber-500' : 'bg-slate-400'
              }`}
            >
              <span className="sr-only">Chave Geral</span>
              {loadingFeature === 'masterActive' ? (
                <span className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isMasterActive ? 'translate-x-5' : 'translate-x-0'
                }`}>
                  <CircleNotch className="animate-spin text-[10px] text-fg-muted" />
                </span>
              ) : (
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isMasterActive ? 'translate-x-5' : 'translate-x-0'
                }`} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Individual Modules */}
      <div>
        <h4 className="text-xs font-bold text-fg-heading uppercase tracking-wider mb-4">Módulos Premium Individuais</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const isActive = premiumConfig[mod.key];
            const IconComponent = mod.icon;
            const isLoading = loadingFeature === mod.key;
            const isModuleDisabled = !isMasterActive || isLoading;

            return (
              <div
                key={mod.key}
                className={`flex flex-col justify-between p-5 bg-white border rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md ${
                  isActive && isMasterActive ? 'border-slate-200' : 'border-slate-100 opacity-60'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      isMasterActive ? mod.color : 'text-fg-muted bg-slate-100'
                    } transition-all duration-300`}>
                      <IconComponent className="text-xl shrink-0" weight={isActive ? 'fill' : 'regular'} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-fg-heading">{mod.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive 
                          ? (isMasterActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isActive ? (isMasterActive ? 'Ativo' : 'Ativo (Suspenso)') : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-fg-subtle leading-relaxed min-h-[48px]">
                    {mod.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-fg-muted">
                    {isActive ? (isMasterActive ? 'Ativado' : 'Suspenso') : 'Desativado'}
                  </span>
                  
                  <button
                    disabled={isModuleDisabled}
                    onClick={() => handleToggle(mod.key, isActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 ${
                      isActive && isMasterActive ? mod.activeColor : 'bg-slate-200'
                    }`}
                  >
                    <span className="sr-only">Ativar módulo</span>
                    {isLoading ? (
                      <span
                        className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      >
                        <CircleNotch className="animate-spin text-[10px] text-fg-muted" />
                      </span>
                    ) : (
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parcerias Master Toggle Card */}
      <div className={`p-6 rounded-2xl border transition-all duration-300 mt-8 ${
        isParceriasActive && isMasterActive
          ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/60 via-teal-50/20 to-white shadow-sm'
          : 'border-slate-200 bg-slate-100 opacity-90'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-xl shrink-0 transition-all duration-300 ${
              isParceriasActive && isMasterActive ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-300 text-fg-muted'
            }`}>
              <Handshake className="text-2xl shrink-0" weight="bold" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-fg-heading">Chave Geral de Adicionais (Financiamento e Seguro)</h3>
              <p className="text-xs text-fg-subtle mt-1 leading-relaxed max-w-xl">
                Ativa ou desativa simultaneamente todos os simuladores de parcerias (Seguro Auto e Financiamento) exibidos nas páginas de detalhes dos veículos.
              </p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 ${
                isParceriasActive && isMasterActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isParceriasActive && isMasterActive ? 'Simuladores de Financiamento e Seguro Ativos' : 'Todos os Simuladores Desativados'}
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
                isParceriasActive && isMasterActive ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            >
              <span className="sr-only">Chave Geral de Parcerias</span>
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

      {/* Individual Partnership Modules */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-fg-heading uppercase tracking-wider mb-4">Adicionais de Parcerias Individuais</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {partnershipModules.map((mod) => {
            const isActive = premiumConfig[mod.key] !== false;
            const IconComponent = mod.icon;
            const isLoading = loadingFeature === mod.key;
            const isModuleDisabled = !isMasterActive || !isParceriasActive || isLoading;

            return (
              <div
                key={mod.key}
                className={`flex flex-col justify-between p-5 bg-white border rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md ${
                  isActive && isParceriasActive && isMasterActive ? 'border-slate-200' : 'border-slate-100 opacity-60'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      isMasterActive && isParceriasActive ? mod.color : 'text-fg-muted bg-slate-100'
                    } transition-all duration-300`}>
                      <IconComponent className="text-xl shrink-0" weight={isActive ? 'fill' : 'regular'} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-fg-heading">{mod.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive 
                          ? (isMasterActive && isParceriasActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isActive ? (isMasterActive && isParceriasActive ? 'Ativo' : 'Ativo (Suspenso)') : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-fg-subtle leading-relaxed min-h-[48px]">
                    {mod.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-fg-muted">
                    {isActive ? (isMasterActive && isParceriasActive ? 'Ativado' : 'Suspenso') : 'Desativado'}
                  </span>
                  
                  <button
                    disabled={isModuleDisabled}
                    onClick={() => handleToggle(mod.key, isActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 ${
                      isActive && isMasterActive && isParceriasActive ? mod.activeColor : 'bg-slate-200'
                    }`}
                  >
                    <span className="sr-only">Ativar adicional</span>
                    {isLoading ? (
                      <span
                        className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      >
                        <CircleNotch className="animate-spin text-[10px] text-fg-muted" />
                      </span>
                    ) : (
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
