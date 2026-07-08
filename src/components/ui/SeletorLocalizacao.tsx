'use client';

import { CaretDown, CircleNotch } from '@phosphor-icons/react';
import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';
import { useConcelhos } from '@/hooks/useConcelhos';
import { useCountry } from '@/providers/CountryProvider';
import { term } from '@/lib/terms';

interface SeletorLocalizacaoProps {
  distrito: string;
  concelho: string;
  onChange: (distrito: string, concelho: string) => void;
  obrigatorio?: boolean;
  erro?: boolean;
  className?: string;
}

export default function SeletorLocalizacao({
  distrito,
  concelho,
  onChange,
  obrigatorio,
  erro,
  className = '',
}: SeletorLocalizacaoProps) {
  const { distritos } = useDistritosConcelhos();
  // BR cities come from the full IBGE list (loaded per state); PT is synchronous.
  const { concelhos, loading: loadingCidades } = useConcelhos(distrito);
  const { country } = useCountry();
  // PT: Distrito/Concelho · BR: Estado/Cidade
  const regionLabel = term('districtLabel', country);
  const cityLabel = term('municipalityLabel', country);

  // appearance-none removes the cramped native arrow so we can render our own
  // chevron with comfortable padding (pr-10 keeps the text clear of it).
  const baseSelect =
    'w-full appearance-none bg-white border rounded-xl pl-3.5 pr-10 py-3 text-sm text-fg-strong ' +
    'focus:outline-none focus:ring-3 focus:ring-accent/25 focus:border-accent transition ' +
    'disabled:bg-neutral-100 disabled:text-fg-subtle disabled:cursor-not-allowed';
  const labelCls = 'block text-xs font-bold text-fg mb-1.5';

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <div>
        <label className={labelCls}>
          {regionLabel} {obrigatorio && <span className="text-danger-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={distrito}
            onChange={(e) => onChange(e.target.value, '')}
            className={`${baseSelect} ${erro && !distrito ? 'border-danger-500' : 'border-neutral-300'}`}
          >
            <option value="">Selecionar {regionLabel.toLowerCase()}</option>
            {distritos.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <CaretDown
            size={16}
            weight="bold"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>
          {cityLabel} {obrigatorio && <span className="text-danger-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={concelho}
            onChange={(e) => onChange(distrito, e.target.value)}
            disabled={!distrito || loadingCidades}
            className={`${baseSelect} ${erro && !concelho ? 'border-danger-500' : 'border-neutral-300'}`}
          >
            <option value="">
              {!distrito
                ? `Selecione um ${regionLabel.toLowerCase()}`
                : loadingCidades
                  ? 'A carregar…'
                  : `Selecionar ${cityLabel.toLowerCase()}`}
            </option>
            {concelhos.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {loadingCidades ? (
            <CircleNotch
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-accent"
            />
          ) : (
            <CaretDown
              size={16}
              weight="bold"
              className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
                distrito ? 'text-fg-subtle' : 'text-neutral-300'
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
