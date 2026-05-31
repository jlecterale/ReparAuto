'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, 
  PlusCircle, 
  MagnifyingGlass, 
  MapPin, 
  Star,
  CaretDown
} from '@phosphor-icons/react';
import { subscribeOficinas } from '@/lib/db';
import type { OficinaMecanico, EspecialidadeOficina } from '@/types/oficina';
import { ESPECIALIDADES_LABELS } from '@/types/oficina';
import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

export default function Oficinas() {
  const router = useRouter();
  const [oficinas, setOficinas] = useState<OficinaMecanico[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [busca, setBusca] = useState('');
  const [especialidade, setEspecialidade] = useState<EspecialidadeOficina | ''>('');
  const [distrito, setDistrito] = useState('');

  const { distritos } = useDistritosConcelhos();

  useEffect(() => {
    const unsub = subscribeOficinas(
      (data) => {
        setOficinas(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const oficinasFiltradas = oficinas.filter((oficina) => {
    const correspondeBusca = 
      oficina.nome.toLowerCase().includes(busca.toLowerCase()) ||
      oficina.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      oficina.responsavel.toLowerCase().includes(busca.toLowerCase());

    const correspondeEspecialidade = 
      !especialidade || oficina.especialidades.includes(especialidade);

    const correspondeDistrito = 
      !distrito || oficina.distrito === distrito;

    return correspondeBusca && correspondeEspecialidade && correspondeDistrito;
  });

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Banner */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Oficinas & Mecânicos
            </h1>
            <p className="mt-3 text-gray-200 text-sm sm:text-base max-w-xl">
              Encontre especialistas de confiança para o seu carro. Desde mecânica convencional e pintura até preparação para pista e detalhe automóvel.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                tipo="primario"
                icone={<PlusCircle size={20} />}
                onClick={() => router.push('/oficinas/registar')}
                className="rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                Registar Minha Oficina
              </Button>
            </div>
          </div>
        </div>
        <Wrench className="absolute right-[-40px] bottom-[-40px] text-white/5 text-[18rem] pointer-events-none transform -rotate-12" />
      </div>

      {/* Filters and List Layout */}
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 mb-6 lg:mb-0 shadow-sm sticky top-6">
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
                  className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
                <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            {/* Specialty Filter */}
            <div>
              <label className="block text-xs font-bold text-fg-subtle mb-1.5 uppercase tracking-wider">
                Especialidade
              </label>
              <div className="relative">
                <select
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value as EspecialidadeOficina | '')}
                  className="w-full appearance-none bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="">Todas as especialidades</option>
                  {Object.entries(ESPECIALIDADES_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <CaretDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-xs font-bold text-fg-subtle mb-1.5 uppercase tracking-wider">
                Distrito
              </label>
              <div className="relative">
                <select
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  className="w-full appearance-none bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="">Todos os distritos</option>
                  {distritos.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <CaretDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            {/* Clear Filters */}
            {(busca || especialidade || distrito) && (
              <button
                onClick={() => {
                  setBusca('');
                  setEspecialidade('');
                  setDistrito('');
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-fg-strong">
              {loading ? 'A carregar...' : `${oficinasFiltradas.length} profissionais encontrados`}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl h-48" />
              ))}
            </div>
          ) : oficinasFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center shadow-sm">
              <Wrench size={48} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
              <h3 className="text-base font-bold text-fg-strong">Nenhuma oficina encontrada</h3>
              <p className="text-sm text-fg-subtle mt-1">
                Tente ajustar os filtros de pesquisa ou especialidade.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {oficinasFiltradas.map((oficina) => (
                <article
                  key={oficina.id}
                  onClick={() => router.push(`/oficinas/detalhes/${oficina.id}`)}
                  className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border border-brand-100 dark:border-brand-900">
                        {oficina.logoUrl ? (
                          <img src={oficina.logoUrl} alt={oficina.nome} className="w-full h-full object-cover rounded-xl" />
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
                          <span className="truncate">{oficina.localidade}, {oficina.distrito}</span>
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

                  {/* Specialties & Action */}
                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex flex-wrap gap-1.5 items-center">
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
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
