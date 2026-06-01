'use client';

import { IdentificationCard, Invoice, RoadHorizon } from '@phosphor-icons/react';
import { useState } from 'react';
import { TIPOS_MANUTENCAO } from '@/lib/constants';
import type { CarroFormData } from '@/types/carro';
import Button from '@/components/ui/Button';

interface StepPrecoProps {
  dados: CarroFormData;
  setDados: React.Dispatch<React.SetStateAction<CarroFormData>>;
  onBack: () => void;
  onPublicar: () => void;
  carregando?: boolean;
}

export default function StepPreco({ dados, setDados, onBack, onPublicar, carregando }: StepPrecoProps) {
  const [erros, setErros] = useState<Record<string, boolean>>({});
  const [telefoneDiferente, setTelefoneDiferente] = useState(false);

  const atualizar = (campo: string, valor: unknown) => {
    setDados((prev) => {
      const next = { ...prev, [campo]: valor };
      if (!telefoneDiferente && campo === 'vendedorWhatsApp') {
        next.vendedorTelefone = valor as string;
      }
      return next;
    });
    setErros((prev) => ({ ...prev, [campo]: false }));
  };

  const toggleManutencao = (tipo: string) => {
    const atuais = dados.tiposManutencao || [];
    const novos = atuais.includes(tipo)
      ? atuais.filter((t) => t !== tipo)
      : [...atuais, tipo];
    atualizar('tiposManutencao', novos);
  };

  const validar = () => {
    const novosErros: Record<string, boolean> = {};
    if (!dados.preco || Number(dados.preco) <= 0) novosErros.preco = true;
    if (!dados.descricao?.trim()) novosErros.descricao = true;
    if (dados.estadoVeiculo === 'manutencao' && (!dados.tiposManutencao || dados.tiposManutencao.length === 0)) {
      novosErros.tiposManutencao = true;
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length === 0) {
      onPublicar();
    }
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  };

  const getSugestaoPreco = (valor: string) => {
    if (!valor || Number(valor) <= 0) return 'Pode anunciar carros ou motos de qualquer valor (baixo custo ou premium).';
    if (Number(valor) <= 2000) return '💡 Preço low-cost! Ótimo para atrair compradores rápidos.';
    if (Number(valor) <= 10000) return '💰 Preço médio. Considere destacar o bom estado do veículo.';
    return '🏆 Carro premium. Destaque os diferenciais e a documentação em dia.';
  };

  return (
    <div>
      <h3 className="font-bold text-lg mb-3">💰 Preço, Descrição & Estado</h3>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-fg-heading mb-1">
          Preço (€) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          placeholder="Ex: 950 ou 15000"
          value={dados.preco || ''}
          onChange={(e) => atualizar('preco', e.target.value)}
          className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-bold text-lg ${
            erros.preco ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        {erros.preco && <span className="text-xs text-red-500 mt-1 block">O preço deve ser superior a 0.</span>}
        <p className="text-xs text-fg-subtle mt-1">{getSugestaoPreco(dados.preco)}</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-fg-heading mb-1">
          Descrição do Carro <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={6}
          placeholder="Descreva os detalhes do veículo..."
          value={dados.descricao || ''}
          onChange={(e) => atualizar('descricao', e.target.value)}
          className={`w-full border-2 rounded-xl p-3.5 text-sm focus:outline-none transition leading-relaxed shadow-inner ${
            erros.descricao ? 'border-red-400' : 'border-slate-200 focus:border-accent'
          }`}
        />
        {erros.descricao && <span className="text-xs text-red-500 mt-1 block">A descrição do carro é obrigatória.</span>}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
        <span className="block text-sm font-bold text-fg-heading mb-2">
          Estado do Veículo <span className="text-red-500">*</span>
        </span>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-fg">
            <input
              type="radio"
              name="estadoVeiculo"
              value="pronto"
              checked={dados.estadoVeiculo !== 'manutencao'}
              onChange={() => atualizar('estadoVeiculo', 'pronto')}
              className="text-accent focus:ring-accent w-4 h-4"
            />
            Pronto para rodar
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-fg">
            <input
              type="radio"
              name="estadoVeiculo"
              value="manutencao"
              checked={dados.estadoVeiculo === 'manutencao'}
              onChange={() => atualizar('estadoVeiculo', 'manutencao')}
              className="text-accent focus:ring-accent w-4 h-4"
            />
            Precisa de manutenção / reparos
          </label>
        </div>

        {dados.estadoVeiculo === 'manutencao' && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-3 shadow-inner">
              <div>
                <span className="block text-xs font-bold text-fg-subtle mb-2">
                  <RoadHorizon className="mr-1 text-slate-400" /> Estado de Circulação
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-fg">
                    <input
                      type="radio"
                      name="rodando"
                      value="sim"
                      checked={dados.rodando !== 'nao'}
                      onChange={() => atualizar('rodando', 'sim')}
                      className="text-accent focus:ring-accent w-4 h-4"
                    />
                    Sim (A rodar)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-fg">
                    <input
                      type="radio"
                      name="rodando"
                      value="nao"
                      checked={dados.rodando === 'nao'}
                      onChange={() => atualizar('rodando', 'nao')}
                      className="text-accent focus:ring-accent w-4 h-4"
                    />
                    Não (Parado)
                  </label>
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-fg-subtle mb-2">
                  <Invoice className="mr-1 text-slate-400" /> Inspeção (IPO)
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-fg">
                    <input
                      type="radio"
                      name="inspecao"
                      value="sim"
                      checked={dados.inspecao !== 'nao'}
                      onChange={() => atualizar('inspecao', 'sim')}
                      className="text-accent focus:ring-accent w-4 h-4"
                    />
                    Com Inspeção
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-fg">
                    <input
                      type="radio"
                      name="inspecao"
                      value="nao"
                      checked={dados.inspecao === 'nao'}
                      onChange={() => atualizar('inspecao', 'nao')}
                      className="text-accent focus:ring-accent w-4 h-4"
                    />
                    Sem Inspeção
                  </label>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-fg-subtle mb-2">
                Tipo de manutenção necessária (múltipla escolha)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {TIPOS_MANUTENCAO.filter((t) => t !== 'Outro').map((tipo) => (
                  <label
                    key={tipo}
                    className={`flex items-center gap-2 p-2 bg-white border rounded-lg hover:border-accent cursor-pointer transition ${
                      (dados.tiposManutencao || []).includes(tipo) ? 'border-accent bg-orange-50/30' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={(dados.tiposManutencao || []).includes(tipo)}
                      onChange={() => toggleManutencao(tipo)}
                      className="rounded text-accent focus:ring-accent"
                    />
                    {tipo}
                  </label>
                ))}
              </div>
              {erros.tiposManutencao && (
                <span className="text-xs text-red-500 mt-1 block">
                  Selecione pelo menos um tipo de manutenção.
                </span>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <span className="block text-xs font-bold text-fg-subtle mb-1.5">
                Orçamento preexistente (opcional)
              </span>
              <textarea
                rows={3}
                placeholder="Cole aqui os detalhes ou valores do orçamento que já possui..."
                value={dados.orcamentoTexto || ''}
                onChange={(e) => atualizar('orcamentoTexto', e.target.value)}
                className="w-full border border-slate-200 focus:border-accent rounded-lg p-2 text-xs focus:outline-none transition"
              />
              <div className="flex flex-col sm:flex-row gap-3 mt-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-fg-muted">
                  <input
                    type="checkbox"
                    checked={!!dados.incluirMecanicoNome}
                    onChange={(e) => atualizar('incluirMecanicoNome', e.target.checked)}
                    className="rounded text-accent focus:ring-accent"
                  />
                  Incluir nome do mecânico / oficina
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-fg-muted">
                  <input
                    type="checkbox"
                    checked={!!dados.incluirMecanicoTelefone}
                    onChange={(e) => atualizar('incluirMecanicoTelefone', e.target.checked)}
                    className="rounded text-accent focus:ring-accent"
                  />
                  Incluir telefone do mecânico / oficina
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {dados.incluirMecanicoNome && (
                  <input
                    type="text"
                    placeholder="Nome da oficina/mecânico"
                    value={dados.mecanicoNome || ''}
                    onChange={(e) => atualizar('mecanicoNome', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-accent"
                  />
                )}
                {dados.incluirMecanicoTelefone && (
                  <input
                    type="tel"
                    placeholder="Telefone do mecânico"
                    value={dados.mecanicoTelefone || ''}
                    onChange={(e) => atualizar('mecanicoTelefone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-accent"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
        <span className="block text-sm font-bold text-fg-heading mb-3 flex items-center gap-2">
          <IdentificationCard className="text-blue-500" /> Contacto do Vendedor
        </span>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-fg-subtle mb-1">
              WhatsApp / Telefone <span className="text-green-600">(recomendado)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-fg-muted">+</span>
              <input
                type="tel"
                placeholder="351 912 345 678"
                value={dados.vendedorWhatsApp || ''}
                onChange={(e) => atualizar('vendedorWhatsApp', e.target.value.replace(/\s/g, ''))}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <p className="text-[10px] text-fg-subtle mt-0.5">Nº com código do país (ex: 351912345678)</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-fg-muted select-none">
            <input
              type="checkbox"
              checked={telefoneDiferente}
              onChange={(e) => {
                setTelefoneDiferente(e.target.checked);
                if (!e.target.checked) {
                  setDados((prev) => ({ ...prev, vendedorTelefone: prev.vendedorWhatsApp }));
                }
              }}
              className="rounded text-accent focus:ring-accent"
            />
            Telefone diferente do WhatsApp
          </label>
          {telefoneDiferente && (
            <div>
              <label className="block text-xs font-semibold text-fg-subtle mb-1">Telefone</label>
              <input
                type="tel"
                placeholder="912 345 678"
                value={dados.vendedorTelefone || ''}
                onChange={(e) => atualizar('vendedorTelefone', e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-fg-subtle mb-1">Email de Contacto</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={dados.vendedorEmail || ''}
              onChange={(e) => atualizar('vendedorEmail', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          tipo="secundario"
          tamanho="lg"
          onClick={onBack}
          className="flex-1"
        >
          Voltar
        </Button>
        <Button
          tipo="verde"
          tamanho="lg"
          onClick={validar}
          carregando={carregando}
          className="flex-1"
        >
          {carregando ? 'A publicar…' : '✅ Publicar Anúncio'}
        </Button>
      </div>
    </div>
  );
}
