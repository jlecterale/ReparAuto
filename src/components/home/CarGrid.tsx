'use client';

import { Car, ChatCircleDots, Envelope, Lightning, MagnifyingGlass, MapPin, Phone, Question, SignIn, SlidersHorizontal, TrendDown, TrendUp, User, WhatsappLogo, Wrench, Star, CaretDown } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';
import CarCard from './CarCard';
import { CarCardSkeleton } from '@/components/ui/Skeleton';
import { formatarPreco, obterWhatsApp } from '@/lib/utils';
import { buscarIntencoesMatch, getIntencoesAtivas, subscribeOficinas } from '@/lib/db';
import { docCountry, filterByCountry } from '@/lib/country';
import { term } from '@/lib/terms';
import { useCountry } from '@/providers/CountryProvider';
import type { IntencaoCompra } from '@/types/intencao';
import type { OficinaMecanico } from '@/types/oficina';
import { ESPECIALIDADES_LABELS } from '@/types/oficina';

type TipoGrid = 'carros' | 'intencoes' | 'oficinas';

const quickChips = [
  { label: 'Todas as Ofertas', value: 'qualquer' },
  { label: 'Destaques Low-Cost', value: 'lowcost' },
  { label: 'Até 500€', value: '500' },
  { label: 'Até 1.000€', value: '1000' },
] as const;

export default function CarGrid() {
  const { carros, auth, chat, loginModal } = useApp();
  const { country } = useCountry();
  const [tipo, setTipo] = useState<TipoGrid>('carros');
  const [intencoesMatch, setIntencoesMatch] = useState<IntencaoCompra[]>([]);
  const [loadingIntencoes, setLoadingIntencoes] = useState(false);
  const [telefonesVisiveis, setTelefonesVisiveis] = useState<Set<string>>(new Set());
  const [oficinas, setOficinas] = useState<OficinaMecanico[]>([]);
  const [loadingOficinas, setLoadingOficinas] = useState(false);
  const { user } = auth;
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
    // Market isolation (plan 20): these direct fetches bypass the context
    // hooks, so they filter by the active country themselves.
    if (tipo === 'intencoes') {
      setLoadingIntencoes(true);
      if (searchQuery) {
        // country rides along so the match logic compares intents against the
        // active market, not the PT default of a country-less object.
        const carroExemplo = { marca: searchQuery, preco: advPriceMax || undefined, local: advDistrito || undefined, country };
        buscarIntencoesMatch(carroExemplo, auth.user?.uid || '')
          .then((list) => setIntencoesMatch(filterByCountry(list, country)))
          .catch(() => setIntencoesMatch([]))
          .finally(() => setLoadingIntencoes(false));
      } else {
        getIntencoesAtivas()
          .then((list) => setIntencoesMatch(filterByCountry(list, country)))
          .catch(() => setIntencoesMatch([]))
          .finally(() => setLoadingIntencoes(false));
      }
    } else if (tipo === 'oficinas') {
      setLoadingOficinas(true);
      const unsub = subscribeOficinas(
        (data) => {
          setOficinas(filterByCountry(data, country));
          setLoadingOficinas(false);
        },
        (err) => {
          console.error(err);
          setLoadingOficinas(false);
        }
      );
      return unsub;
    }
  }, [tipo, searchQuery, advPriceMax, advDistrito, auth.user?.uid, country]);

  const oficinasFiltradas = oficinas.filter((o) => {
    const correspondeBusca = !searchQuery ||
      (o.nome && o.nome.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.descricao && o.descricao.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const correspondeDistrito = !advDistrito || o.distrito === advDistrito;

    return correspondeBusca && correspondeDistrito;
  });

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start">
      {/* ============ FILTER PANEL (left column) ============ */}
      <aside className="mb-6 lg:mb-0 lg:sticky lg:top-5 space-y-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder={
                tipo === 'oficinas'
                  ? "Ex: Recar Garage..."
                  : tipo === 'intencoes'
                  ? "Ex: Procurando Clio..."
                  : "Ex: Renault Clio..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-full bg-white text-fg placeholder-slate-500 border border-slate-300 focus:outline-none focus:border-accent transition text-sm"
            />
          </div>

          {/* Search type select dropdown */}
          <div className="space-y-1">
            <label htmlFor="search-type" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ver resultados de:
            </label>
            <div className="relative">
              <select
                id="search-type"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoGrid)}
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-fg border border-slate-200 focus:outline-none focus:border-accent focus:bg-white transition text-sm appearance-none cursor-pointer font-medium"
              >
                <option value="carros">🚗 Carros</option>
                <option value="intencoes">💡 Intenções de Compra</option>
                <option value="oficinas">🔧 Oficinas & Mecânicos</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <CaretDown size={16} />
              </div>
            </div>
          </div>

          {/* Quick chips */}
          {tipo === 'carros' && (
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
          )}

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
            {tipo === 'carros' && (
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
            )}

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
                    <option value="">{term('districtAllOption', country)}</option>
                    {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={advConcelho} onChange={(e) => setAdvConcelho(e.target.value)}
                    disabled={!advDistrito}
                    className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-accent ${!advDistrito ? 'bg-slate-100 text-fg-subtle cursor-not-allowed' : 'text-fg'}`}>
                    <option value="">{advDistrito ? term('municipalityAllOption', country) : term('districtSelectOption', country)}</option>
                    {getConcelhos(advDistrito).map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <select value={raioDist} onChange={(e) => handleRaioDistChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-fg focus:outline-none focus:border-accent">
                    <option value="">{term('districtSelectOption', country)}</option>
                    {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={advRaioCentro} onChange={(e) => setAdvRaioCentro(e.target.value)}
                    disabled={!raioDist}
                    className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-accent ${!raioDist ? 'bg-slate-100 text-fg-subtle cursor-not-allowed' : 'text-fg'}`}>
                    <option value="">{raioDist ? 'Selecionar centro' : term('districtSelectOption', country)}</option>
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

            {tipo === 'carros' && (
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
            )}

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
        ) : tipo === 'oficinas' ? (
          <>
            <h2 className="text-xl font-bold text-fg-heading mb-4 flex items-center gap-2">
              <Wrench className="text-accent" /> Oficinas & Mecânicos
            </h2>
            {loadingOficinas ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <CarCardSkeleton key={i} />)}
              </div>
            ) : oficinasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 text-fg-subtle">
                <Wrench size={48} className="mb-3 text-slate-300" />
                <p className="font-semibold">Nenhuma oficina encontrada</p>
                <p className="text-sm">Tente alterar os filtros ou pesquisa.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {oficinasFiltradas.map((oficina) => (
                  <div key={oficina.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:border-accent/40 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border border-brand-100">
                          {oficina.logoUrl ? (
                            <img src={oficina.logoUrl} alt={oficina.nome || ''} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            oficina.nome ? oficina.nome.substring(0, 2).toUpperCase() : 'OF'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/oficinas/detalhes/${oficina.id}`} className="hover:text-accent font-bold text-fg-heading text-sm truncate block">
                            {oficina.nome || ''}
                          </Link>
                          <div className="flex items-center gap-1 text-[11px] text-fg-muted mt-0.5">
                            <MapPin size={12} className="text-slate-400" />
                            <span className="truncate">{oficina.localidade || ''}, {oficina.distrito || ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-2 text-xs">
                        <Star size={12} weight="fill" className="text-amber-500" />
                        <span className="font-bold text-fg-strong">{oficina.mediaAvaliacoes?.toFixed(1) || '5.0'}</span>
                        <span className="text-fg-muted">({oficina.totalAvaliacoes || 0})</span>
                      </div>
                      <p className="text-xs text-fg-muted line-clamp-2 mb-3">{oficina.descricao || ''}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {(oficina.especialidades || []).slice(0, 2).map((esp) => (
                        <span key={esp} className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-semibold">
                          {ESPECIALIDADES_LABELS[esp]}
                        </span>
                      ))}
                      <Link href={`/oficinas/detalhes/${oficina.id}`} className="w-full text-center text-xs font-bold text-accent hover:underline pt-2 mt-1">
                        Ver detalhes completo →
                      </Link>
                    </div>
                  </div>
                ))}
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
                {intencoesMatch.map((intencao) => {
                  const whatsapp = obterWhatsApp(intencao.vendedorWhatsApp, intencao.vendedorTelefone, docCountry(intencao));
                  const email = intencao.vendedorEmail || '';
                  const temWhatsApp = !!whatsapp;
                  const temTelefone = !!intencao.vendedorTelefone && intencao.mostrarTelefone;
                  const isOwn = user?.uid === intencao.userId;
                  const temChat = !!user && !!intencao.userId && !isOwn;
                  const mostrarTel = telefonesVisiveis.has(intencao.id);

                  return (
                   <div key={intencao.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:border-accent/40 hover:shadow-md transition-all flex flex-col">
                    <div className="flex-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5 ${
                        intencao.categoria === 'carro' ? 'bg-blue-100 text-blue-700' :
                        intencao.categoria === 'moto' ? 'bg-orange-100 text-orange-700' :
                        intencao.categoria === 'viatura_comercial' ? 'bg-purple-100 text-purple-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {intencao.categoria === 'carro' ? '🚗 Carro' :
                         intencao.categoria === 'moto' ? '🏍️ Moto' :
                         intencao.categoria === 'viatura_comercial' ? '🚐 Comercial' :
                         '⚙️ Peças'}
                      </span>
                      <Link href={`/intencao/${intencao.id}`} className="hover:text-accent transition-colors">
                        <h3 className="font-bold text-fg-heading text-sm mb-2">{intencao.titulo}</h3>
                      </Link>
                      <div className="space-y-1 text-xs text-fg-muted">
                        {intencao.categoria !== 'pecas' ? (
                          <>
                            <p><span className="text-fg-subtle">Ano:</span> {intencao.criterios.anoMinimo}{intencao.criterios.anoMaximo ? `–${intencao.criterios.anoMaximo}` : '+'}</p>
                            <p><span className="text-fg-subtle">Combustível:</span> {intencao.criterios.combustivel.join(', ')}</p>
                            <p><span className="text-fg-subtle">Km máx:</span> {intencao.criterios.quilometragemMaxima.toLocaleString('pt-PT')} km</p>
                          </>
                        ) : (
                          <p className="italic text-fg-muted text-xs mb-1">{intencao.descricao?.slice(0, 120)}</p>
                        )}
                        <p><span className="text-fg-subtle">Orçamento:</span> até {formatarPreco(intencao.criterios.precoMaximo, docCountry(intencao))}</p>
                        <p><span className="text-fg-subtle">Local:</span> {intencao.criterios.localizacao.distrito} ({intencao.criterios.localizacao.raio}km)</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-semibold text-fg-subtle flex items-center gap-1">
                        <User className="text-slate-400" />
                        {intencao.vendedorNome || 'Comprador'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {temWhatsApp && (
                          <a
                            href={`https://wa.me/${whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-3 rounded-xl transition text-xs"
                          >
                            <WhatsappLogo size={14} />
                            WhatsApp
                          </a>
                        )}
                        {!!email && (
                          <a
                            href={`mailto:${email}`}
                            className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-fg font-semibold py-1.5 px-3 rounded-xl transition border border-slate-300 text-xs"
                          >
                            <Envelope size={14} />
                            Email
                          </a>
                        )}
                      </div>
                      {temTelefone && !mostrarTel && (
                        <Button
                          tipo="primario"
                          tamanho="sm"
                          blocoCompleto
                          icone={<Phone size={14} />}
                          onClick={() => setTelefonesVisiveis(new Set(telefonesVisiveis).add(intencao.id))}
                        >
                          Ver Telefone
                        </Button>
                      )}
                      {temTelefone && mostrarTel && (
                        <a
                          href={`tel:${intencao.vendedorTelefone}`}
                          className="flex items-center justify-center gap-1.5 w-full bg-accent hover:bg-accent-hover text-white font-bold py-1.5 px-3 rounded-xl transition text-xs"
                        >
                          <Phone size={14} />
                          {intencao.vendedorTelefone}
                        </a>
                      )}
                      {temChat && (
                        <Button
                          tipo="azul"
                          tamanho="sm"
                          blocoCompleto
                          icone={<ChatCircleDots size={14} />}
                          onClick={() => chat?.abrirChat(intencao.id, 'intencao', intencao.titulo, intencao.userId, intencao.vendedorNome || 'Comprador')}
                        >
                          Enviar Mensagem
                        </Button>
                      )}
                      {!user && (
                        <button
                          onClick={() => loginModal.openLoginModal('/')}
                          className="flex items-center justify-center gap-1.5 w-full bg-slate-100 hover:bg-slate-200 text-fg-muted font-semibold py-1.5 px-3 rounded-xl transition text-xs"
                        >
                          <SignIn size={14} />
                          Faça login para contactar
                        </button>
                      )}
                      <Link
                        href={`/intencao/${intencao.id}`}
                        className="block text-center text-xs text-accent font-semibold hover:underline pt-1"
                      >
                        Ver detalhes completos →
                      </Link>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
