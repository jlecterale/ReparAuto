import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { useCountry } from '@/context/CountryContext';
import { useCepBr } from '@/hooks/useCepBr';
import { formatarCodigoPostal } from '@/lib/format';

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

interface CepAutofillInputProps {
  /** The form's current city — the "auto-filled" note only shows while it still matches the lookup. */
  city: string;
  /** Called once per successful lookup; the host form decides where each piece lands. */
  onFound: (address: CepAddress) => void;
}

/**
 * BR-only CEP input that auto-fills the listing's location (standard UX in
 * Brazilian marketplaces: typing a CEP beats scrolling ~5500 municipalities).
 * Renders nothing for other markets, so call sites don't need country gates.
 * The CEP itself is just an input helper — it is not persisted anywhere.
 * Mirrors the web `src/components/ui/CepAutofillField.tsx`.
 */
export function CepAutofillInput({ city, onFound }: CepAutofillInputProps) {
  const { country } = useCountry();
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
    <View>
      <Input
        label="CEP (opcional)"
        value={cep}
        onChangeText={(t) => {
          const formatted = formatarCodigoPostal(t, 'BR');
          setCep(formatted);
          if (formatted.replace(/\D/g, '').length === 8) {
            void lookup.buscar(formatted);
          }
        }}
        placeholder="Ex: 01310-100"
        keyboardType="number-pad"
        maxLength={9}
        error={lookup.erro || undefined}
      />
      {lookup.loading ? (
        <Text className="mt-1 text-xs text-fg-subtle">A procurar endereço…</Text>
      ) : autoFilled ? (
        <Text className="mt-1 text-xs text-success-600">✓ Preenchido automaticamente pelo CEP</Text>
      ) : !lookup.erro ? (
        <Text className="mt-1 text-xs text-fg-subtle">
          Digite o CEP para preencher a localização automaticamente.
        </Text>
      ) : null}
    </View>
  );
}
