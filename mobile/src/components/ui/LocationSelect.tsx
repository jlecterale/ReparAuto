import { View } from 'react-native';
import { SelectField } from '@/components/ui/SelectField';
import { useConcelhos } from '@/hooks/useConcelhos';
import { getDistritos } from '@/lib/geo';
import { useCountry } from '@/context/CountryContext';
import { term } from '@/lib/terms';

interface LocationSelectProps {
  /** Region (PT distrito / BR estado). */
  distrito: string;
  /** City (PT concelho / BR município). */
  localidade: string;
  /** Called with the new pair; picking a region clears the city. */
  onChange: (distrito: string, localidade: string) => void;
  required?: boolean;
}

/**
 * Country-aware region + city picker pair (Distrito/Concelho in PT,
 * Estado/Cidade in BR). PT cities come from the bundled dataset; BR loads the
 * full IBGE municipality list for the chosen state. The city accepts a custom
 * value so a missing/offline list never blocks publishing. Mobile counterpart
 * of the web `SeletorLocalizacao`.
 */
export function LocationSelect({ distrito, localidade, onChange, required = false }: LocationSelectProps) {
  const { country } = useCountry();
  const distritos = getDistritos(country);
  const { concelhos, loading } = useConcelhos(distrito);
  const districtLabel = term('districtLabel', country);
  const cityLabel = term('municipalityLabel', country);
  const suffix = required ? ' *' : '';

  return (
    <View className="flex-row gap-3">
      <View className="flex-1">
        <SelectField
          label={`${districtLabel}${suffix}`}
          value={distrito}
          onChange={(d) => onChange(d, '')}
          options={distritos}
          placeholder={term('districtSelectOption', country)}
          title={districtLabel}
        />
      </View>
      <View className="flex-1">
        <SelectField
          label={`${cityLabel}${suffix}`}
          value={localidade}
          onChange={(c) => onChange(distrito, c)}
          options={concelhos}
          loading={loading}
          disabled={!distrito}
          allowCustom
          title={cityLabel}
        />
      </View>
    </View>
  );
}
