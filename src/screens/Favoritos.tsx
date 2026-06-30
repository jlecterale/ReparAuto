'use client';

import { Heart, GearSix, Wrench, MapPin, Star } from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import { useRouter } from 'next/navigation';
import CarCard from '@/components/home/CarCard';
import PecasCard from '@/components/pecas/PecasCard';
import { CarCardSkeleton, PecaCardSkeleton } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ESPECIALIDADES_LABELS } from '@/types/oficina';
import type { Peca } from '@/types/peca';

export default function Favoritos() {
  const { carros, pecas, oficinas, favoritos } = useApp();
  const router = useRouter();

  const carrosGuardados = carros.carros.filter((c) => favoritos.favoritos.includes(String(c.id)));
  const pecasGuardadas = pecas.pecas.filter((p) => favoritos.favoritos.includes(String(p.id)));
  const servicosGuardados = oficinas.oficinas.filter((s) => favoritos.favoritos.includes(String(s.id)));
  const totalGuardados = carrosGuardados.length + pecasGuardadas.length + servicosGuardados.length;

  const loading = carros.loading || pecas.loading || oficinas.loading;

  const handleDetalhesPeca = (peca: Peca) => {
    router.push(`/pecas/${peca.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-extrabold text-fg-heading flex items-center gap-2">
          <Heart weight="fill" className="text-accent" /> Os Meus Favoritos
        </h1>
        {totalGuardados > 0 && (
          <span className="text-sm font-semibold text-fg-subtle">({totalGuardados})</span>
        )}
      </div>

      {loading && totalGuardados === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            i % 2 === 0 ? <CarCardSkeleton key={i} /> : <PecaCardSkeleton key={i} />
          ))}
        </div>
      ) : totalGuardados === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-4 bg-white rounded-2xl shadow-lg">
          <Heart size={40} className="text-neutral-300 mb-3" />
          <p className="font-semibold text-fg-muted">Ainda não guardou nenhum anúncio.</p>
          <p className="text-sm text-fg-subtle mt-1 mb-4">
            Toque no coração de um anúncio para o guardar aqui.
          </p>
          <Button tipo="primario" tamanho="sm" onClick={() => router.push('/app')}>
            Ver anúncios
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {carrosGuardados.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-fg-heading flex items-center gap-2 mb-4">
                🚗 Carros ({carrosGuardados.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {carrosGuardados.map((carro) => (
                  <CarCard key={carro.id} carro={carro} />
                ))}
              </div>
            </section>
          )}
          {pecasGuardadas.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-fg-heading flex items-center gap-2 mb-4">
                <GearSix /> Peças ({pecasGuardadas.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pecasGuardadas.map((peca) => (
                  <PecasCard key={peca.id} peca={peca} onDetalhes={handleDetalhesPeca} />
                ))}
              </div>
            </section>
          )}
          {servicosGuardados.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-fg-heading flex items-center gap-2 mb-4">
                <Wrench /> Oficinas ({servicosGuardados.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {servicosGuardados.map((oficina) => (
                  <article
                    key={oficina.id}
                    onClick={() => router.push(`/oficinas/detalhes/${oficina.id}`)}
                    className="bg-white rounded-2xl shadow-md overflow-hidden p-5 flex flex-col cursor-pointer hover:shadow-lg transition group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border border-brand-100">
                        {oficina.logoUrl ? (
                          <img src={oficina.logoUrl} alt={oficina.nome} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          oficina.nome.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-fg-strong group-hover:text-accent transition truncate">
                          {oficina.nome}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-fg-subtle">
                          <MapPin size={12} />
                          <span className="truncate">{oficina.localidade}</span>
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star size={12} weight="fill" />
                        <span>{oficina.mediaAvaliacoes?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-fg-muted line-clamp-2 mb-3 flex-1">{oficina.descricao}</p>
                    <div className="flex flex-wrap gap-1 border-t border-neutral-100 pt-2">
                      {oficina.especialidades.slice(0, 2).map((esp) => (
                        <Badge key={esp} cor="brand" variante="soft" className="text-[10px] px-2 py-0.5">
                          {ESPECIALIDADES_LABELS[esp]}
                        </Badge>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
