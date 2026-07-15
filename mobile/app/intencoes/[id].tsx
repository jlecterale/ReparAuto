import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { getIntencaoById } from '@/lib/trust';
import { formatKm, formatPreco } from '@/lib/format';
import { docCountry } from '@/lib/country';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { CATEGORIA_INTENCAO_LABELS, type IntencaoCompra } from '@/types';
import { colors } from '@/theme/colors';

export default function IntencaoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [intencao, setIntencao] = useState<IntencaoCompra | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getIntencaoById(id)
      .then((i) => active && setIntencao(i))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }
  if (!intencao) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-8">
        <Ionicons name="alert-circle-outline" size={56} color={colors.neutral[300]} />
        <Text className="mt-3 text-lg font-bold text-fg-heading">Procura não encontrada</Text>
      </View>
    );
  }

  const c = intencao.criterios;
  const podeContactar = intencao.userId !== user?.uid;
  const mostraTel = intencao.mostrarTelefone && intencao.vendedorTelefone;

  return (
    <View className="flex-1 bg-neutral-50">
      <Stack.Screen options={{ title: intencao.titulo }} />
      <ScrollView contentContainerClassName="p-4 pb-28">
        <View className="self-start rounded bg-primary-100 px-2 py-0.5">
          <Text className="text-xs font-bold text-primary-700">
            {CATEGORIA_INTENCAO_LABELS[intencao.categoria]}
          </Text>
        </View>
        <Text className="mt-2 text-2xl font-extrabold text-fg-heading">{intencao.titulo}</Text>

        {!!intencao.descricao && (
          <Text className="mt-2 text-base leading-6 text-fg">{intencao.descricao}</Text>
        )}

        <Text className="mb-2 mt-5 text-lg font-bold text-fg-heading">Critérios</Text>
        <View className="flex-row flex-wrap">
          <Spec icon="car-outline" label="Marca" value={c?.marca || 'Qualquer'} />
          <Spec icon="car-sport-outline" label="Modelo" value={c?.modelo || 'Qualquer'} />
          <Spec
            icon="calendar-outline"
            label="Ano"
            value={c?.anoMinimo ? `${c.anoMinimo}${c.anoMaximo ? `–${c.anoMaximo}` : '+'}` : '—'}
          />
          <Spec
            icon="cash-outline"
            label="Preço máx."
            value={c?.precoMaximo ? formatPreco(c.precoMaximo, docCountry(intencao)) : '—'}
          />
          <Spec
            icon="speedometer-outline"
            label="Km máx."
            value={c?.quilometragemMaxima ? formatKm(c.quilometragemMaxima) : '—'}
          />
          <Spec
            icon="location-outline"
            label={docCountry(intencao) === 'BR' ? 'Estado' : 'Distrito'}
            value={c?.localizacao?.distrito || '—'}
          />
        </View>

        {!!c?.combustivel?.length && (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {c.combustivel.map((f) => (
              <View key={f} className="rounded-full bg-neutral-100 px-3 py-1">
                <Text className="text-xs font-semibold text-fg-muted">{f}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {podeContactar && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-neutral-200 bg-white px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Button
            label="Tenho este carro"
            className="flex-1"
            icon={<Ionicons name="chatbubble-ellipses" size={18} color="#fff" />}
            onPress={() =>
              requireAuth(() =>
                router.push({
                  pathname: '/chat/[listingId]',
                  params: {
                    listingId: intencao.id,
                    listingType: 'intencao',
                    listingTitle: intencao.titulo,
                    outroUid: intencao.userId,
                    outroNome: intencao.vendedorNome || 'Comprador',
                  },
                }),
              )
            }
          />
          {mostraTel ? (
            <Button
              label="Ligar"
              variant="outline"
              className="flex-1"
              icon={<Ionicons name="call" size={18} color={colors.primary[700]} />}
              onPress={() => Linking.openURL(`tel:${intencao.vendedorTelefone}`)}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

function Spec({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="mb-3 w-1/2 flex-row items-center pr-3">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
        <Ionicons name={icon} size={18} color={colors.primary[600]} />
      </View>
      <View className="ml-2.5 flex-1">
        <Text className="text-xs text-fg-subtle">{label}</Text>
        <Text className="text-sm font-semibold text-fg" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}
