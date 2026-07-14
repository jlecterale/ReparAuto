'use client';

import { Circle, MagnifyingGlass, MapPin, SlidersHorizontal, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { CATEGORIAS_PECAS, ESTADOS_PECA } from '@/lib/constants';
import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';
import { useCountry } from '@/providers/CountryProvider';
import { term } from '@/lib/terms';
import Button from '@/components/ui/Button';

const filtros = [
  { value: 'todos', label: 'Todos os Anúncios' },
  { value: 'venda', label: 'Venda de Peças' },
  { value: 'desmonte', label: 'Carros p/ Desmonte' },
  { value: 'procura', label: 'Procura de Peças' },
];

export default function PecasFilter({ total }: { total: number }) {
  const { pecas } = useApp();
  const {
    filtroTipo,
    setFiltroTipo,
    searchTerm,
    setSearchTerm,
    filtroCategoria,
    setFiltroCategoria,
    filtroEstado,
    setFiltroEstado,
    advDistrito,
    setAdvDistrito,
    advConcelho,
    setAdvConcelho,
    advRaioCentro,
    setAdvRaioCentro,
    advRaioKm,
    setAdvRaioKm,
  } = pecas;

  const { distritos, getConcelhos } = useDistritosConcelhos();
  const { country } = useCountry();
  const [raioMode, setRaioMode] = useState(false);
  const [raioDist, setRaioDist] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters =
    searchTerm.trim() || filtroCategoria || filtroEstado || advDistrito || advConcelho || (advRaioCentro && advRaioKm);

  const limparFiltros = () => {
    setSearchTerm('');
    setFiltroCategoria('');
    setFiltroEstado('');
    setAdvDistrito('');
    setAdvConcelho('');
    setAdvRaioCentro('');
    setAdvRaioKm(null);
    setRaioMode(false);
    setRaioDist('');
  };

  return (
    <aside className="mb-6 lg:mb-0 lg:sticky lg:top-5 space-y-3">
      {/* Type tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-1">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroTipo(f.value as 'todos' | 'venda' | 'desmonte' | 'procura')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              filtroTipo === f.value
                ? 'bg-accent text-white'
                : 'text-fg-muted hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="border-t border-slate-100 mt-2 pt-2 text-center">
          <span className="text-xs bg-slate-100 text-fg-muted px-3 py-1 rounded-full font-medium">
            {total} anúncio{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Procurar peças..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-fg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fg-muted text-sm cursor-pointer"
            >
              <X />
            </button>
          )}
        </div>

        {/* Advanced filters toggle (mobile only) */}
        <Button
          tipo="secundario"
          tamanho="sm"
          icone={<SlidersHorizontal />}
          blocoCompleto
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="lg:hidden"
        >
          {showAdvanced ? 'Ocultar filtros' : 'Mais filtros'}
        </Button>

        <div className={`${showAdvanced ? 'block' : 'hidden'} lg:block space-y-4`}>
          <div>
            <label className="block text-xs font-bold text-fg-subtle mb-1">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-fg focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition cursor-pointer"
            >
              <option value="">Todas as Categorias</option>
              {CATEGORIAS_PECAS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-fg-subtle mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-fg focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition cursor-pointer"
            >
              <option value="">Todos os Estados</option>
              {ESTADOS_PECA.map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>

          {/* Localização */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-fg-subtle flex items-center gap-1">
                <MapPin className="text-accent" /> Localização
              </span>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-fg-muted cursor-pointer select-none mb-2">
              <input
                type="checkbox"
                checked={raioMode}
                onChange={(e) => {
                  setRaioMode(e.target.checked);
                  if (!e.target.checked) {
                    setAdvRaioCentro('');
                    setAdvRaioKm(null);
                    setRaioDist('');
                  } else {
                    setAdvDistrito('');
                    setAdvConcelho('');
                  }
                }}
                className="rounded text-accent focus:ring-accent"
              />
              Por raio
            </label>

            {!raioMode ? (
              <div className="space-y-2">
                <select
                  value={advDistrito}
                  onChange={(e) => { setAdvDistrito(e.target.value); setAdvConcelho(''); }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-fg focus:outline-none focus:border-accent"
                >
                  <option value="">{term('districtAllOption', country)}</option>
                  {distritos.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={advConcelho}
                  onChange={(e) => setAdvConcelho(e.target.value)}
                  disabled={!advDistrito}
                  className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-fg focus:outline-none focus:border-accent ${!advDistrito ? 'bg-slate-100 text-fg-subtle cursor-not-allowed' : ''}`}
                >
                  <option value="">{advDistrito ? term('municipalityAllOption', country) : term('districtSelectOption', country)}</option>
                  {getConcelhos(advDistrito).map((c) => (
                    <option key={c.nome} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={raioDist}
                  onChange={(e) => { setRaioDist(e.target.value); setAdvRaioCentro(''); }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-fg focus:outline-none focus:border-accent"
                >
                  <option value="">{term('districtSelectOption', country)}</option>
                  {distritos.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={advRaioCentro}
                  onChange={(e) => setAdvRaioCentro(e.target.value)}
                  disabled={!raioDist}
                  className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-fg focus:outline-none focus:border-accent ${!raioDist ? 'bg-slate-100 text-fg-subtle cursor-not-allowed' : ''}`}
                >
                  <option value="">{raioDist ? 'Selecionar centro' : term('districtSelectOption', country)}</option>
                  {getConcelhos(raioDist).map((c) => (
                    <option key={c.nome} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    placeholder="Raio km"
                    value={advRaioKm ?? ''}
                    onChange={(e) => setAdvRaioKm(e.target.value ? Number(e.target.value) : null)}
                    className="w-24 border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-fg focus:outline-none focus:border-accent"
                  />
                  <span className="text-xs text-fg-subtle truncate">de {advRaioCentro || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              tipo="secundario"
              tamanho="sm"
              blocoCompleto
              onClick={limparFiltros}
            >
              Limpar todos os filtros
            </Button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm.trim() && (
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              <MagnifyingGlass className="text-[10px]" />
              &ldquo;{searchTerm.trim()}&rdquo;
              <button onClick={() => setSearchTerm('')} className="hover:text-accent-hover ml-0.5 cursor-pointer">
                <X />
              </button>
            </span>
          )}
          {filtroCategoria && (
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              {filtroCategoria}
              <button onClick={() => setFiltroCategoria('')} className="hover:text-accent-hover ml-0.5 cursor-pointer">
                <X />
              </button>
            </span>
          )}
          {filtroEstado && (
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              {filtroEstado}
              <button onClick={() => setFiltroEstado('')} className="hover:text-accent-hover ml-0.5 cursor-pointer">
                <X />
              </button>
            </span>
          )}
          {advDistrito && !advConcelho && (
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              <MapPin className="text-[10px]" />
              {advDistrito}
              <button onClick={() => { setAdvDistrito(''); setAdvConcelho(''); }} className="hover:text-accent-hover ml-0.5 cursor-pointer">
                <X />
              </button>
            </span>
          )}
          {advConcelho && (
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              <MapPin className="text-[10px]" />
              {advConcelho}
              <button onClick={() => setAdvConcelho('')} className="hover:text-accent-hover ml-0.5 cursor-pointer">
                <X />
              </button>
            </span>
          )}
          {advRaioCentro && advRaioKm && (
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              <Circle className="text-[10px]" />
              {advRaioKm}km de {advRaioCentro}
              <button onClick={() => { setAdvRaioCentro(''); setAdvRaioKm(null); setRaioMode(false); setRaioDist(''); }} className="hover:text-accent-hover ml-0.5 cursor-pointer">
                <X />
              </button>
            </span>
          )}
        </div>
      )}
    </aside>
  );
}
