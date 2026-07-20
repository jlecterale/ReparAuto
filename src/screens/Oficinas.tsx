'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Wrench, 
  PlusCircle, 
  MagnifyingGlass, 
  MapPin, 
  Star,
  Heart,
  CaretDown,
  Truck,
  Disc
} from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import type { OficinaMecanico, EspecialidadeOficina, ServiceType } from '@/types/oficina';
import { ESPECIALIDADES_LABELS } from '@/types/oficina';
import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';
import { useCountry } from '@/providers/CountryProvider';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getStatusFuncionamento } from '@/lib/hours';
import { term } from '@/lib/terms';

// Load map dynamically to prevent SSR/window errors
const MapServicos = dynamic(() => import('@/components/ui/MapServicos'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-neutral-100 animate-pulse rounded-3xl flex items-center justify-center text-sm text-neutral-400">
      A carregar mapa interativo...
    </div>
  ),
});

interface OficinasProps {
  initialServiceType?: ServiceType;
}

export default function Oficinas({ initialServiceType = 'workshop' }: OficinasProps) {
  const router = useRouter();
  const { oficinas, favoritos } = useApp();
  const { toggleFavorito, isFavorito } = favoritos;
  const { oficinas: workshopsList, guinchos, borracharias, loading } = oficinas;

  const baseList = useMemo(() => {
    if (initialServiceType === 'towing') return guinchos;
    if (initialServiceType === 'tire_repair') return borracharias;
    return workshopsList;
  }, [initialServiceType, workshopsList, guinchos, borracharias]);

  // Filters
  const [busca, setBusca] = useState('');
  const [especialidade, setEspecialidade] = useState<EspecialidadeOficina | ''>('');
  const [towingCapability, setTowingCapability] = useState<string>('');
  const [distrito, setDistrito] = useState('');
  const [bairro, setBairro] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const { distritos } = useDistritosConcelhos();
  const { country } = useCountry();

  // Only neighbourhoods that actually have workshops are offered (BR; facet)
  const bairroOpts = useMemo(() => {
    return [...new Set(baseList.map((o) => o.bairro).filter((b): b is string => !!b))]
      .sort((a, b) => a.localeCompare(b, 'pt'));
  }, [baseList]);

  const oficinasFiltradas = useMemo(() => {
    return baseList.filter((oficina) => {
      const correspondeBusca =
        oficina.nome.toLowerCase().includes(busca.toLowerCase()) ||
        oficina.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        oficina.responsavel.toLowerCase().includes(busca.toLowerCase());

      const correspondeEspecialidade =
        initialServiceType === 'towing'
          ? (!towingCapability || (oficina.towingDetails?.capabilities ?? []).includes(towingCapability as any))
          : (!especialidade || oficina.especialidades.includes(especialidade));

      const correspondeDistrito =
        !distrito || oficina.distrito === distrito;

      const correspondeBairro =
        !bairro || (oficina.bairro ?? '').toLowerCase() === bairro.toLowerCase();

      return correspondeBusca && correspondeEspecialidade && correspondeDistrito && correspondeBairro;
    });
  }, [baseList, busca, especialidade, towingCapability, distrito, bairro, initialServiceType]);

  const bannerTitle = () => {
    if (initialServiceType === 'towing') return term('towingTitle', country);
    if (initialServiceType === 'tire_repair') return term('tireTitle', country);
    return term('workshopTitle', country);
  };

  const bannerDesc = () => {
    if (initialServiceType === 'towing') return term('towingDescription', country);
    if (initialServiceType === 'tire_repair') return term('tireDescription', country);
    return term('workshopDescription', country);
  };

  const registerButtonText = () => {
    if (initialServiceType === 'towing') return term('towingRegisterButton', country);
    if (initialServiceType === 'tire_repair') return term('tireRegisterButton', country);
    return term('workshopRegisterButton', country);
  };

  const getRegisterPath = () => {
    return '/oficinas/registar'; // Forms handles service types inside
  };

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Banner */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {bannerTitle()}
            </h1>
            <p className="mt-3 text-gray-200 text-sm sm:text-base max-w-xl">
              {bannerDesc()}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                tipo="primario"
                icone={<PlusCircle size={20} />}
                onClick={() => router.push(getRegisterPath())}
                className="rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                {registerButtonText()}
              </Button>
            </div>
          </div>
        </div>
        {initialServiceType === 'towing' ? (
          <Truck className="absolute right-[-40px] bottom-[-40px] text-white/5 text-[18rem] pointer-events-none transform -rotate-12" />
        ) : initialServiceType === 'tire_repair' ? (
          <Disc className="absolute right-[-40px] bottom-[-40px] text-white/5 text-[18rem] pointer-events-none transform -rotate-12" />
        ) : (
          <Wrench className="absolute right-[-40px] bottom-[-40px] text-white/5 text-[18rem] pointer-events-none transform -rotate-12" />
        )}
      </div>

      {/* Filters and List Layout */}
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="bg-white border border-neutral-200 rounded-2xl p-5 mb-6 lg:mb-0 shadow-sm sticky top-6">
          <h2 className="text-base font-bold text-fg-strong mb-4">Filtrar Profissionais</h2>
          
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-bold text-fg-subtle mb-1.5 uppercase tracking-wider">
                Pesquisa
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nome, palavra-chave..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
                <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

             {/* Specialty / Capability Filter */}
             {initialServiceType === 'towing' ? (
               <div>
                 <label className="block text-xs font-bold text-fg-subtle mb-1.5 uppercase tracking-wider">
                   Capacidade
                 </label>
                 <div className="relative">
                   <select
                     value={towingCapability}
                     onChange={(e) => setTowingCapability(e.target.value)}
                     className="w-full appearance-none bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                   >
                     <option value="">Todas as capacidades</option>
                     <option value="light">{country === 'BR' ? 'Veículos Leves (Passeio)' : 'Veículos Ligeiros'}</option>
                     <option value="heavy">Veículos Pesados (Carga)</option>
                     <option value="motorcycle">{country === 'BR' ? 'Motocicletas / Motos' : 'Motociclos / Motos'}</option>
                     <option value="classic">Veículos Clássicos</option>
                     <option value="agricultural">Veículos Agrícolas / Especiais</option>
                   </select>
                   <CaretDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                 </div>
               </div>
             ) : (
               <div>
                 <label className="block text-xs font-bold text-fg-subtle mb-1.5 uppercase tracking-wider">
                   Especialidade
                 </label>
                 <div className="relative">
                   <select
                     value={especialidade}
                     onChange={(e) => setEspecialidade(e.target.value as EspecialidadeOficina | '')}
                     className="w-full appearance-none bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                   >
                     <option value="">Todas as especialidades</option>
                     {Object.entries(ESPECIALIDADES_LABELS).map(([value, label]) => (
                       <option key={value} value={value}>{label}</option>
                     ))}
                   </select>
                   <CaretDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                 </div>
               </div>
             )}

            {/* District Filter */}
            <div>
              <label className="block text-xs font-bold text-fg-subtle mb-1.5 uppercase tracking-wider">
                Distrito
              </label>
              <div className="relative">
                <select
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  className="w-full appearance-none bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="">Todos os distritos</option>
                  {distritos.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <CaretDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            {/* Bairro Filter (BR) — only neighbourhoods with workshops */}
            {country === 'BR' && bairroOpts.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-fg-subtle mb-1.5 uppercase tracking-wider">
                  Bairro
                </label>
                <div className="relative">
                  <select
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full appearance-none bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  >
                    <option value="">Todos os bairros</option>
                    {bairroOpts.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <CaretDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(busca || especialidade || towingCapability || distrito || bairro) && (
              <button
                onClick={() => {
                  setBusca('');
                  setEspecialidade('');
                  setTowingCapability('');
                  setDistrito('');
                  setBairro('');
                }}
                className="w-full text-center py-2 text-xs font-semibold text-accent hover:text-accent-hover transition"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        </aside>

        {/* Results Main Section */}
        <section className="min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-fg-strong">
              {loading
                ? 'A carregar...'
                : `${oficinasFiltradas.length} ${
                    oficinasFiltradas.length === 1
                      ? 'profissional encontrado'
                      : 'profissionais encontrados'
                  }`}
            </h2>
            {!loading && oficinasFiltradas.length > 0 && (
              <div className="flex bg-neutral-100 rounded-xl p-0.5 border border-neutral-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                    viewMode === 'list'
                      ? 'bg-white text-fg-strong shadow-sm font-black'
                      : 'text-fg-subtle hover:text-fg'
                  }`}
                >
                  Ver em Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                    viewMode === 'map'
                      ? 'bg-white text-fg-strong shadow-sm font-black'
                      : 'text-fg-subtle hover:text-fg'
                  }`}
                >
                  Ver no Mapa
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-white border border-neutral-200 rounded-2xl h-48" />
              ))}
            </div>
          ) : oficinasFiltradas.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center shadow-sm">
              {initialServiceType === 'towing' ? (
                <Truck size={48} className="mx-auto text-neutral-300 mb-3" />
              ) : initialServiceType === 'tire_repair' ? (
                <Disc size={48} className="mx-auto text-neutral-300 mb-3" />
              ) : (
                <Wrench size={48} className="mx-auto text-neutral-300 mb-3" />
              )}
              {busca || especialidade || towingCapability || distrito ? (
                <>
                  <h3 className="text-base font-bold text-fg-strong">
                    {initialServiceType === 'towing'
                      ? (country === 'BR' ? 'Nenhum guincho encontrado' : 'Nenhum reboque encontrado')
                      : initialServiceType === 'tire_repair'
                      ? (country === 'BR' ? 'Nenhuma borracharia encontrada' : 'Nenhum vulcanizador encontrado')
                      : 'Nenhuma oficina encontrada'}
                  </h3>
                  <p className="text-sm text-fg-subtle mt-1">
                    Tente ajustar os filtros de pesquisa.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-base font-bold text-fg-strong">
                    {initialServiceType === 'towing'
                      ? (country === 'BR' ? 'Anuncie seu guincho gratuitamente' : 'Anuncie seu reboque gratuitamente')
                      : initialServiceType === 'tire_repair'
                      ? (country === 'BR' ? 'Anuncie sua borracharia gratuitamente' : 'Anuncie seu vulcanizador gratuitamente')
                      : 'Anuncie sua oficina gratuitamente'}
                  </h3>
                  <p className="text-sm text-fg-subtle mt-1">
                    {initialServiceType === 'towing'
                      ? (country === 'BR' ? 'Seja o primeiro guincho a aparecer aqui.' : 'Seja o primeiro reboque a aparecer aqui.')
                      : initialServiceType === 'tire_repair'
                      ? (country === 'BR' ? 'Seja a primeira borracharia a aparecer aqui.' : 'Seja o primeiro vulcanizador a aparecer aqui.')
                      : 'Seja a primeira oficina a aparecer aqui.'}
                  </p>
                  <Button
                    tipo="primario"
                    icone={<PlusCircle size={20} />}
                    onClick={() => router.push(getRegisterPath())}
                    className="rounded-full mt-5 shadow-md"
                  >
                    {initialServiceType === 'towing'
                      ? (country === 'BR' ? 'Anunciar guincho' : 'Anunciar reboque')
                      : initialServiceType === 'tire_repair'
                      ? (country === 'BR' ? 'Anunciar borracharia' : 'Anunciar vulcanizador')
                      : 'Anunciar oficina'}
                  </Button>
                </>
              )}
            </div>
          ) : viewMode === 'map' ? (
            <MapServicos servicos={oficinasFiltradas} country={country} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {oficinasFiltradas.map((oficina) => {
                const getDetailsPath = () => {
                  const type = oficina.serviceType || 'workshop';
                  if (type === 'towing') return `/guinchos/detalhes/${oficina.id}`;
                  if (type === 'tire_repair') return `/borracharias/detalhes/${oficina.id}`;
                  return `/oficinas/detalhes/${oficina.id}`;
                };

                return (
                  <article
                    key={oficina.id}
                    onClick={() => router.push(getDetailsPath())}
                    className="group bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between relative"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorito(oficina.id, 'services');
                      }}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition shadow ${
                        isFavorito(oficina.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 text-fg-muted hover:bg-white'
                      }`}
                    >
                      <Heart weight={isFavorito(oficina.id) ? 'fill' : 'regular'} className={isFavorito(oficina.id) ? '' : 'text-slate-400'} />
                    </button>

                    <div>
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border border-brand-100">
                          {oficina.logoUrl ? (
                            <img src={oficina.logoUrl} alt={oficina.nome} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            oficina.nome.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base text-fg-strong group-hover:text-accent transition truncate">
                            {oficina.nome}
                          </h3>
                          <div className="flex items-center gap-1 mt-0.5 text-sm text-fg-subtle">
                            <MapPin size={14} className="text-neutral-400" />
                            <span className="truncate">{[oficina.bairro, oficina.localidade, oficina.distrito].filter(Boolean).join(', ')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating & Description */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex items-center text-amber-500">
                          <Star size={16} weight="fill" />
                        </div>
                        <span className="text-sm font-bold text-fg-strong">
                          {oficina.mediaAvaliacoes ? oficina.mediaAvaliacoes.toFixed(1) : '5.0'}
                        </span>
                        <span className="text-xs text-fg-subtle">
                          ({oficina.totalAvaliacoes || 0} avaliações)
                        </span>
                      </div>

                      <p className="text-sm text-fg-subtle line-clamp-2 mb-4 leading-relaxed">
                        {oficina.descricao}
                      </p>
                    </div>

                    {/* Badges / Specialties & Live Schedule */}
                    <div className="border-t border-neutral-100 pt-3 flex flex-wrap gap-1.5 items-center">
                      {oficina.serviceType === 'towing' ? (
                        <>
                          {(oficina.towingDetails?.capabilities || []).slice(0, 2).map((cap) => {
                            const labels: Record<string, string> = {
                              light: country === 'BR' ? 'Leves' : 'Ligeiros',
                              heavy: 'Pesados',
                              motorcycle: 'Motos',
                              classic: 'Clássicos',
                              agricultural: 'Especiais',
                            };
                            return (
                              <Badge key={cap} cor="yellow" variante="soft" className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                                🚚 {labels[cap] || cap}
                              </Badge>
                            );
                          })}
                          {(oficina.towingDetails?.capabilities || []).length > 2 && (
                            <span className="text-xs text-neutral-400 font-medium">
                              +{(oficina.towingDetails?.capabilities || []).length - 2}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {oficina.especialidades.slice(0, 2).map((esp) => (
                            <Badge key={esp} cor="brand" variante="soft" className="text-[11px] px-2 py-0.5 font-medium">
                              {ESPECIALIDADES_LABELS[esp]}
                            </Badge>
                          ))}
                          {oficina.especialidades.length > 2 && (
                            <span className="text-xs text-neutral-400 font-medium">
                              +{oficina.especialidades.length - 2}
                            </span>
                          )}
                        </>
                      )}

                      {/* Live Open / Closed Badge */}
                      <div className="ml-auto shrink-0">
                        {(() => {
                          const hoursInfo = getStatusFuncionamento(oficina.workingHours);
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${hoursInfo.colorClass}`}>
                              {hoursInfo.status === '24h' ? '🚨 24H' : hoursInfo.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
