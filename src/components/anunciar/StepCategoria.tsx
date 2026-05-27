type CategoriaAnuncio = 'carro' | 'peca';

interface StepCategoriaProps {
  onSelect: (categoria: CategoriaAnuncio) => void;
}

const opcoes = [
  {
    value: 'carro' as CategoriaAnuncio,
    icon: 'fa-solid fa-car',
    label: 'Carro / Moto',
    subtitulo: 'Anuncie o seu veículo para venda',
  },
  {
    value: 'peca' as CategoriaAnuncio,
    icon: 'fa-solid fa-gears',
    label: 'Peças / Desmonte',
    subtitulo: 'Venda peças, desmonte ou procure peças',
  },
];

export default function StepCategoria({ onSelect }: StepCategoriaProps) {
  return (
    <div>
      <h3 className="font-bold text-lg mb-1">O que pretende anunciar?</h3>
      <p className="text-sm text-gray-500 mb-5">Escolha o tipo de anúncio para continuar.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {opcoes.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 bg-slate-50 rounded-xl hover:border-accent hover:bg-orange-50/30 cursor-pointer transition text-center select-none"
          >
            <i className={`${opt.icon} text-3xl text-accent mb-3`}></i>
            <span className="text-base font-bold text-slate-800">{opt.label}</span>
            <span className="text-xs text-slate-500 mt-1">{opt.subtitulo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
