'use client';

import { Heart } from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import { useRouter } from 'next/navigation';
import CarCard from '@/components/home/CarCard';
import { CarCardSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

export default function Favoritos() {
  const { carros, favoritos } = useApp();
  const router = useRouter();

  const guardados = carros.carros.filter((c) => favoritos.favoritos.includes(String(c.id)));

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-extrabold text-fg-heading flex items-center gap-2">
          <Heart weight="fill" className="text-accent" /> Os Meus Favoritos
        </h1>
        {guardados.length > 0 && (
          <span className="text-sm font-semibold text-fg-subtle">({guardados.length})</span>
        )}
      </div>

      {carros.loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CarCardSkeleton key={i} />
          ))}
        </div>
      ) : guardados.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-4 bg-white rounded-2xl shadow-lg">
          <Heart size={40} className="text-neutral-300 mb-3" />
          <p className="font-semibold text-fg-muted">Ainda não guardou nenhum anúncio.</p>
          <p className="text-sm text-fg-subtle mt-1 mb-4">
            Toque no coração de um anúncio para o guardar aqui.
          </p>
          <Button tipo="primario" tamanho="sm" onClick={() => router.push('/')}>
            Ver anúncios
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {guardados.map((carro) => (
            <CarCard key={carro.id} carro={carro} />
          ))}
        </div>
      )}
    </div>
  );
}
