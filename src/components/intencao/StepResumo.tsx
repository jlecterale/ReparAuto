'use client';

import { formatarPreco } from '@/lib/utils';
import { CATEGORIAS_INTENCAO } from '@/lib/constants';

interface StepResumoProps {
  form: Record<string, any>;
  aceiteTermos: boolean;
  onToggleTermos: () => void;
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-fg-subtle">{label}</span>
      <span className="text-xs font-semibold text-fg text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function StepResumo({ form, aceiteTermos, onToggleTermos }: StepResumoProps) {
  const c = form.criterios || {};
  const p = form.preferencias || {};
  const cat = form.categoria;
  const catLabel = CATEGORIAS_INTENCAO.find(x => x.value === cat)?.emoji || '';

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-4 space-y-1">
        <h4 className="text-sm font-extrabold text-fg-heading mb-2">Resumo da Intenção</h4>
        <Detail label="Categoria" value={catLabel ? `${catLabel} ${cat}` : cat} />
        {cat === 'pecas' ? (
          <Detail label="Descrição" value={form.descricao} />
        ) : (
          <>
            <Detail label="Marca / Modelo" value={`${c.marca} ${c.modelo}`} />
            <Detail label="Ano" value={c.anoMaximo ? `${c.anoMinimo} – ${c.anoMaximo}` : `A partir de ${c.anoMinimo}`} />
          </>
        )}
        <Detail label="Orçamento" value={c.precoMinimo ? `${formatarPreco(c.precoMinimo)} – ${formatarPreco(c.precoMaximo)}` : `Até ${formatarPreco(c.precoMaximo)}`} />
        {cat !== 'pecas' && (
          <>
            <Detail label="Combustível" value={c.combustivel?.join(', ')} />
            <Detail label="Transmissão" value={c.tipoTransmissao?.join(', ')} />
            <Detail label="Km máximo" value={c.quilometragemMaxima ? `${c.quilometragemMaxima.toLocaleString('pt-PT')} km` : ''} />
          </>
        )}
        <Detail label="Localização" value={
          c.localizacao?.distrito === 'todo_portugal'
            ? '🇵🇹 Todo Portugal'
            : c.localizacao?.distrito
              ? `${c.localizacao.distrito} (${c.localizacao.raio} km)`
              : ''
        } />
        {cat !== 'pecas' && (
          <>
            {p.cores?.length > 0 && <Detail label="Cores" value={p.cores.join(', ')} />}
            {p.tipoCarroceria?.length > 0 && <Detail label="Carroceria" value={p.tipoCarroceria.join(', ')} />}
            {p.itensDesejados?.length > 0 && <Detail label="Itens" value={p.itensDesejados.join(', ')} />}
            {p.aceitaFinanciamento && <Detail label="Financiamento" value="Sim" />}
            {p.aceitaTroca && <Detail label="Troca" value="Sim" />}
          </>
        )}
        <Detail label="Contacto" value={form.contatoPreferido} />
        {form.descricao && cat !== 'pecas' && <Detail label="Observações" value={form.descricao} />}
      </div>

      <label className="flex items-start gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={aceiteTermos}
          onChange={onToggleTermos}
          className="mt-0.5 rounded text-accent focus:ring-accent"
        />
        <span className="text-fg-muted">
          Concordo com os <span className="text-accent font-semibold">Termos de Utilização</span> e autorizo vendedores a contactar-me sobre a minha intenção de compra.
        </span>
      </label>
    </div>
  );
}
