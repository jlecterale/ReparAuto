import { formatarPreco } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Carro } from '@/types/carro';

export default function StatusPanel({ carro }: { carro: Carro | null }) {
  if (!carro) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="text-center sm:text-left">
        <span className="text-3xl sm:text-4xl font-extrabold text-accent">
          {formatarPreco(carro.preco)}
        </span>
        {carro.preco <= 2000 && (
          <div className="mt-1">
            <Badge cor="accent">Low-Cost</Badge>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
        <p className="text-xs font-semibold text-slate-500">Contacto do Vendedor</p>
        <div className="flex items-center gap-2 text-sm text-brand-700">
          <i className="fa-solid fa-user text-slate-400"></i>
          <span>{carro.vendedorNome || carro.criador || 'Anunciante'}</span>
        </div>
        {carro.vendedorTelefone && (
          <a
            href={`tel:${carro.vendedorTelefone}`}
            className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover font-semibold"
          >
            <i className="fa-solid fa-phone"></i>
            {carro.vendedorTelefone}
          </a>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <i className="fa-solid fa-calendar"></i>
          Publicado em {new Date((carro.dataCriacao as any)?.toDate?.() || carro.dataCriacao || Date.now()).toLocaleDateString('pt-PT')}
        </p>
      </div>
    </div>
  );
}
