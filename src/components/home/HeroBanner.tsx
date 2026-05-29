import { ArrowDown, Car } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';

export default function HeroBanner() {
  const scrollToOfertas = () => {
    const el = document.getElementById('ofertas');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-5 sm:p-8 text-white mb-8 sm:mb-10 shadow-xl relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            O teu próximo carro está aqui.<br />Classificados de Carros em Portugal.
          </h1>
          <p className="mt-2 text-gray-300 text-sm sm:text-base">
            Carros low‑cost, viaturas para reparações e uma aba exclusiva de valor livre.
          </p>
          <Button
            tipo="ghost"
            iconeFim={<ArrowDown weight="bold" className="shrink-0" />}
            onClick={scrollToOfertas}
            className="mt-4 whitespace-nowrap"
          >
            Ver Oportunidades
          </Button>
        </div>
      </div>
      <Car className="absolute right-[-20px] bottom-[-20px] text-white/5 text-[15rem] pointer-events-none transform -rotate-12" />
    </div>
  );
}
