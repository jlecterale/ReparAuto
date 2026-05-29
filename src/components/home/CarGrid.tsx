'use client';

import { Car, Lightning, MagnifyingGlass, MapPin, Question, SlidersHorizontal, TrendDown, TrendUp } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';
import CarCard from './CarCard';
import { CarCardSkeleton } from '@/components/ui/Skeleton';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { formatarPreco } from '@/lib/utils';
import { buscarIntencoesMatch } from '@/lib/db';
import type { IntencaoCompra } from '@/types/intencao';

type TipoGrid = 'carros' | 'intencoes';

const quickChips = [
  { label: 'Todas as Ofertas', value: 'qualquer' },
  { label: 'Destaques Low-Cost', value: 'lowcost' },
  { label: 'Até 500€', value: '500' },
  { label: 'Até 1.000€', value: '1000' },
] as const;

export default function CarGrid() {
  const { carros, auth } = useApp();
  const [tipo, setTipo] = useState<TipoGrid>('carros');
  const [intencoesMatch, setIntencoesMatch] = useState<IntencaoCompra[]>([]);
  const [loadingIntencoes, setLoadingIntencoes] = useState(false);
  const {
    carrosFiltrados,
    filtroAtivo,
    setFiltroAtivo,
    searchQuery,
    setSearchQuery,
    advPriceMin,
    setAdvPriceMin,
    advPriceMax,
    setAdvPriceMax,
    advDistrito,
    setAdvDistrito,
    advConcelho,
    setAdvConcelho,
    advRaioCentro,
    setAdvRaioCentro,
    advRaioKm,
    setAdvRaioKm,
    sortOrdem,
    setSortOrdem,
  } = carros;

  const { distritos, getConcelhos } = useDistritosConcelhos();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [raioMode, setRaioMode] = useState(false);
  const [raioDist, setRaioDist] = useState('');

  const filtered = carrosFiltrados;

  const limparFiltrosAvancados = () => {
    setAdvPriceMin(null);
    setAdvPriceMax(null);
    setAdvDistrito('');
    setAdvConcelho('');
    setAdvRaioCentro('');
    setAdvRaioKm(null);
    setSortOrdem(null);
    setRaioMode(false);
    setRaioDist('');
  };

  const handleDistritoChange = (d: string) => {
    setAdvDistrito(d);
    setAdvConcelho('');
  };

  const handleRaioDistChange = (d: string) => {
    setRaioDist(d);
    setAdvRaioCentro('');
  };

  const getFiltroLabel = () => {
    switch (filtroAtivo) {
      case 'lowcost': return 'Destaques Low-Cost (Até 2.000€)';
      case '500': return 'Até 500€';
      case '1000': return 'Até 1.000€';
      case 'qualquer': return 'Qualquer Valor';
      default: return 'Todos os anúncios';
    }
  };

  useEffect(() => {
    if (tipo !== 'intencoes') return;
    setLoadingIntencoes(true);
    const carroExemplo = { marca: searchQuery || undefined, preco: advPriceMax || undefined, local: advDistrito || undefined };
    buscarIntencoesMatch(carroExemplo, auth.user?.uid || '')
      .then(setIntencoesMatch)
      .catch(() => setIntencoesMatch([]))
      .finally(() => setLoadingIntencoes(false));
  }, [tipo, searchQuery, advPriceMax, advDistrito, auth.user?.uid]);

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start">
      {/* ============ FILTER PANEL (left column) ============ */}
      <aside className="mb-6 lg:mb-0 lg:sticky lg:top-5 space-y-3">
        {/* Mode toggle */}
        <SegmentedControl<TipoGrid>
          ariaLabel="Alternar entre carros e intenções de compra"
          value={tipo}
          onChange={setTipo}
          options={[
            { value: 'carros', label: 'Carros', icone: <Car weight="fill" /> },
            { value: 'intencoes', label: 'Intenções', icone: <MagnifyingGlass /> },
          ]}
        />

        {tipo === 'carros' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Ex: Renault Clio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-full bg-white text-fg placeholder-slate-500 border border-slate-300 focus:outline-none focus:border-accent transition text-sm"
              />
            </div>

            {/* Quick chips */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-fg-subtle uppercase tracking-wide">Ofertas rápidas</span>
              <div className="flex flex-wrap gap-2">
                {quickChips.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => setFiltroAtivo(filtroAtivo === chip.value ? null : chip.value as 'lowcost' | '500' | '1000' | 'reparar' | 'qualquer')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      filtroAtivo === chip.value
                        ? 'bg-accent text-white border-accent'
                        : 'bg-slate-50 text-fg-muted border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced filters toggle (mobile only) */}
            <Button
              tipo="secundario"
              tamanho="sm"
              blocoCompleto
              icone={<SlidersHorizontal />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="lg:hidden"
            >
              {showAdvanced ? 'Ocultar filtros' : 'Mais filtros'}
            </Button>

            {/* Advanced filters */}
            <div className={`${showAdvanced ? 'block' : 'hidden'} lg:block space-y-4 border-t border-slate-100 pt-4`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fg-subtle mb-1">Preço Mín. (€)</label>
                  <input
                    type="number" placeholder="Mínimo"
                    value={advPriceMin ?? ''}
                    onChange={(e) => setAdvPriceMin(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-fg placeholder-slate-500 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-fg-subtle mb-1">Preço Máx. (€)</label>
                  <input
                    type="number" placeholder="Máximo"
                    value={advPriceMax ?? ''}
                    onChange={(e) => setAdvPriceMax(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-fg placeholder-slate-500 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-fg-subtle flex items-center gap-1">
                    <MapPin className="text-accent" /> Localização
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-fg-muted cursor-pointer select-none mb-2">
                  <input type="checkbox" checked={raioMode}
                    onChange={(e) => { setRaioMode(e.target.checked); if (!e.target.checked) { setAdvRaioCentro(''); setAdvRaioKm(null); setRaioDist(''); } else { setAdvDistrito(''); setAdvConcelho(''); } }}
                    className="rounded text-accent focus:ring-accent" />
                  Pesquisar por raio
                </label>
                {!raioMode ? (
                  <div className="space-y-2">
                    <select value={advDistrito} onChange={(e) => handleDistritoChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-fg focus:outline-none focus:border-accent">
                      <option value="">Todos os distritos</option>
                      {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={advConcelho} onChange={(e) => setAdvConcelho(e.target.value)}
                      disabled={!advDistrito}
                      className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-accent ${!advDistrito ? 'bg-slate-100 text-fg-subtle cursor-not-allowed' : 'text-fg'}`}>
                      <option value="">{advDistrito ? 'Todos os concelhos' : 'Selecione um distrito'}</option>
                      {getConcelhos(advDistrito).map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select value={raioDist} onChange={(e) => handleRaioDistChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-fg focus:outline-none focus:border-accent">
                      <option value="">Selecionar distrito</option>
                      {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={advRaioCentro} onChange={(e) => setAdvRaioCentro(e.target.value)}
                      disabled={!raioDist}
                      className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-accent ${!raioDist ? 'bg-slate-100 text-fg-subtle cursor-not-allowed' : 'text-fg'}`}>
                      <option value="">{raioDist ? 'Selecionar centro' : 'Selecione um distrito'}</option>
                      {getConcelhos(raioDist).map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} max={500} placeholder="Raio km"
                        value={advRaioKm ?? ''}
                        onChange={(e) => setAdvRaioKm(e.target.value ? Number(e.target.value) : null)}
                        className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-fg focus:outline-none focus:border-accent" />
                      <span className="text-xs text-fg-subtle truncate">de {advRaioCentro || '—'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="block text-xs font-bold text-fg-subtle mb-2">Ordenar por preço</span>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setSortOrdem(sortOrdem === 'crescente' ? null : 'crescente')}
                    className={`font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 text-xs ${sortOrdem === 'crescente' ? 'bg-accent text-white' : 'bg-white hover:bg-slate-100 border border-slate-300 text-fg'}`}>
                    <TrendUp /> Mais baixo
                  </button>
                  <button type="button" onClick={() => setSortOrdem(sortOrdem === 'decrescente' ? null : 'decrescente')}
                    className={`font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 text-xs ${sortOrdem === 'decrescente' ? 'bg-accent text-white' : 'bg-white hover:bg-slate-100 border border-slate-300 text-fg'}`}>
                    <TrendDown /> Mais caro
                  </button>
                </div>
              </div>

              <Button
                tipo="secundario"
                tamanho="sm"
                blocoCompleto
                onClick={limparFiltrosAvancados}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* ============ RESULTS (right column) ============ */}
      <section className="min-w-0">
        {tipo === 'carros' ? (
          <>
            <h2 id="ofertas" className="scroll-mt-20 sm:scroll-mt-24 text-xl font-bold text-fg-heading mb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Lightning className="text-accent" /> Oportunidades</span>
              <span className="text-xs bg-slate-200 text-fg px-3 py-1 rounded-full font-medium">{getFiltroLabel()}</span>
            </h2>

            {carros.loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 text-fg-subtle">
                <Car size={48} className="mb-3 text-slate-300" />
                <p className="font-semibold">Nenhum anúncio encontrado</p>
                <p className="text-sm">Tente alterar os filtros ou pesquisa.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {filtered.map((carro) => <CarCard key={carro.id} carro={carro} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-fg-heading mb-4 flex items-center gap-2">
              <MagnifyingGlass className="text-accent" /> Intenções de Compra
            </h2>
            {loadingIntencoes ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <CarCardSkeleton key={i} />)}
              </div>
            ) : intencoesMatch.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 text-fg-subtle">
                <Question size={48} className="mb-3 text-slate-300" />
                <p className="font-semibold">Nenhuma intenção de compra ativa</p>
                <p className="text-sm">Compradores ainda não publicaram intenções.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {intencoesMatch.map((intencao) => (
                  <div key={intencao.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:border-accent/40 transition flex flex-col">
                    <div className="flex-1">
                      <h3 className="font-bold text-fg-heading text-sm mb-2">{intencao.titulo}</h3>
                      <div className="space-y-1 text-xs text-fg-muted">
                        <p><span className="text-fg-subtle">Ano:</span> {intencao.criterios.anoMinimo}{intencao.criterios.anoMaximo ? `–${intencao.criterios.anoMaximo}` : '+'}</p>
                        <p><span className="text-fg-subtle">Orçamento:</span> até {formatarPreco(intencao.criterios.precoMaximo)}</p>
                        <p><span className="text-fg-subtle">Combustível:</span> {intencao.criterios.combustivel.join(', ')}</p>
                        <p><span className="text-fg-subtle">Local:</span> {intencao.criterios.localizacao.distrito} ({intencao.criterios.localizacao.raio}km)</p>
                        <p><span className="text-fg-subtle">Km máx:</span> {intencao.criterios.quilometragemMaxima.toLocaleString('pt-PT')} km</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <Link href={`/anunciar?intencao=${intencao.id}`}
                        className="block text-center text-xs font-bold bg-accent text-white px-3 py-2 rounded-xl hover:bg-accent-hover transition">
                        Tenho um que se adequa
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
