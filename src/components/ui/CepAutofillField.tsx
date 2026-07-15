'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, CircleNotch } from '@phosphor-icons/react';
import Input from '@/components/ui/Input';
import { useCepBr } from '@/hooks/useCepBr';
import { useCountry } from '@/providers/CountryProvider';
import { formatarCodigoPostal } from '@/lib/utils';

/** Address pieces resolved from a CEP, ready for the host form to apply. */
export interface CepAddress {
  /** Full state name, matching the state picker options (e.g. "São Paulo"). */
  state: string;
  city: string;
  /** Empty on "CEP geral" responses that carry no neighbourhood. */
  neighborhood: string;
  /** Empty when the CEP does not resolve to a single street. */
  street: string;
}

interface CepAutofillFieldProps {
  /** The form's current city — the "auto-filled" note only shows while it still matches the lookup. */
  city: string;
  /** Called once per successful lookup; the host form decides where each piece lands. */
  onFound: (address: CepAddress) => void;
  className?: string;
}

/**
 * BR-only CEP field that auto-fills the listing's location (standard UX in
 * Brazilian marketplaces: typing a CEP beats scrolling ~5500 municipalities).
 * Renders nothing for other markets, so call sites don't need country gates.
 * The CEP itself is just an input helper — it is not persisted anywhere.
 */
export default function CepAutofillField({ city, onFound, className }: CepAutofillFieldProps) {
  const { country } = useCountry();
  const inputId = useId();
  const [cep, setCep] = useState('');
  const lookup = useCepBr();
  // Key of the last result handed to the form, so parent re-renders (new
  // onFound identity) never re-apply the same lookup over manual edits.
  const delivered = useRef('');

  useEffect(() => {
    if (!lookup.localidade) return;
    const street = lookup.ruas[0] ?? '';
    const key = [lookup.distrito, lookup.localidade, lookup.bairro, street].join('|');
    if (delivered.current === key) return;
    delivered.current = key;
    onFound({
      state: lookup.distrito,
      city: lookup.localidade,
      neighborhood: lookup.bairro,
      street,
    });
  }, [lookup.localidade, lookup.distrito, lookup.bairro, lookup.ruas, onFound]);

  if (country !== 'BR') return null;

  const autoFilled = !!lookup.localidade && city === lookup.localidade;

  return (
    <div className={className}>
      <Input
        id={inputId}
        label="CEP (opcional)"
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="Ex: 01310-100"
        maxLength={9}
        value={cep}
        onChange={(e) => {
          const formatted = formatarCodigoPostal(e.target.value, 'BR');
          setCep(formatted);
          if (formatted.replace(/\D/g, '').length === 8) {
            void lookup.buscar(formatted);
          }
        }}
        erro={lookup.erro || undefined}
        iconeFim={
          lookup.loading ? <CircleNotch className="animate-spin text-accent" /> : undefined
        }
      />
      {autoFilled ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-success-700">
          <Check weight="bold" /> Preenchido automaticamente pelo CEP
        </p>
      ) : (
        !lookup.erro && (
          <p className="mt-1.5 text-xs text-fg-subtle">
            Digite o CEP para preencher a localização automaticamente.
          </p>
        )
      )}
    </div>
  );
}
