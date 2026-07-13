import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCountry } from '@/context/CountryContext';
import { COUNTRIES, COUNTRY_INFO } from '@/lib/country';
import { colors } from '@/theme/colors';

/**
 * Market (country) picker card — shared by Definições and the logged-out
 * Perfil tab. Signed-in accounts belong to one market (AccountCountrySync
 * locks the selector), so the chips render disabled with a note; anonymous
 * visitors can switch freely.
 */
export function MarketSelector({ className = '' }: { className?: string }) {
  const { country, setCountry, locked } = useCountry();

  return (
    <View className={`overflow-hidden rounded-2xl bg-white ${className}`}>
      <View className="px-4 py-4">
        <View className="flex-row items-center">
          <Ionicons name="globe-outline" size={20} color={colors.primary[600]} />
          <View className="ml-3 flex-1">
            <Text className="text-base font-medium text-fg">Mercado</Text>
            <Text className="text-xs text-fg-subtle">
              Anúncios, preços e localizações do país escolhido
            </Text>
          </View>
        </View>
        <View className="mt-3 flex-row gap-2">
          {COUNTRIES.map((c) => {
            const active = country === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCountry(c)}
                disabled={locked}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: locked }}
                className={`flex-1 flex-row items-center justify-center rounded-full border px-4 py-2 ${
                  active ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 bg-white'
                } ${locked ? 'opacity-50' : ''}`}
              >
                <Text className="text-base">{COUNTRY_INFO[c].flag}</Text>
                <Text
                  className={`ml-1.5 text-sm font-semibold ${
                    active ? 'text-primary-700' : 'text-fg-muted'
                  }`}
                >
                  {COUNTRY_INFO[c].name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {locked && <Text className="mt-2 text-xs text-fg-subtle">Definido pela sua conta</Text>}
      </View>
    </View>
  );
}
