import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { getOficinaById } from '@/lib/db';
import { ESPECIALIDADES_LABELS, type Oficina } from '@/types';
import { colors } from '@/theme/colors';

export default function DetalhesOficinaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [oficina, setOficina] = useState<Oficina | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOficinaById(id)
      .then((o) => active && setOficina(o))
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

  if (!oficina) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-8">
        <Ionicons name="alert-circle-outline" size={56} color={colors.neutral[300]} />
        <Text className="mt-3 text-lg font-bold text-fg-heading">Oficina não encontrada</Text>
      </View>
    );
  }

  const capa = oficina.fotos?.[0] || oficina.logoUrl;
  const morada = [oficina.morada, oficina.localidade, oficina.distrito]
    .filter(Boolean)
    .join(', ');

  return (
    <View className="flex-1 bg-neutral-50">
      <Stack.Screen options={{ title: oficina.nome }} />
      <ScrollView contentContainerClassName="pb-28">
        {capa ? (
          <Image
            source={capa}
            style={{ width, height: width * 0.5 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{ width, height: width * 0.4 }}
            className="items-center justify-center bg-primary-50"
          >
            <Ionicons name="business" size={48} color={colors.primary[600]} />
          </View>
        )}

        <View className="p-4">
          <Text className="text-2xl font-extrabold text-fg-heading">{oficina.nome}</Text>
          {!!oficina.totalAvaliacoes && oficina.totalAvaliacoes > 0 && (
            <View className="mt-1 flex-row items-center">
              <Ionicons name="star" size={16} color={colors.warning[500]} />
              <Text className="ml-1 font-semibold text-fg-muted">
                {oficina.mediaAvaliacoes?.toFixed(1)} · {oficina.totalAvaliacoes} avaliações
              </Text>
            </View>
          )}

          {oficina.especialidades?.length > 0 && (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {oficina.especialidades.map((e) => (
                <View key={e} className="rounded-full bg-primary-50 px-3 py-1">
                  <Text className="text-xs font-semibold text-primary-700">
                    {ESPECIALIDADES_LABELS[e]}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!!oficina.descricao && (
            <View className="mt-5">
              <Text className="mb-2 text-lg font-bold text-fg-heading">Sobre</Text>
              <Text className="text-base leading-6 text-fg">{oficina.descricao}</Text>
            </View>
          )}

          {!!morada && (
            <View className="mt-5 flex-row items-start">
              <Ionicons name="location-outline" size={18} color={colors.primary[600]} />
              <Text className="ml-2 flex-1 text-base text-fg">{morada}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-neutral-200 bg-white px-4 pb-7 pt-3">
        {oficina.whatsapp ? (
          <Button
            label="WhatsApp"
            variant="secondary"
            className="flex-1"
            icon={<Ionicons name="logo-whatsapp" size={18} color="#fff" />}
            onPress={() => Linking.openURL(`https://wa.me/${oficina.whatsapp}`)}
          />
        ) : null}
        {oficina.telefone ? (
          <Button
            label="Ligar"
            className="flex-1"
            icon={<Ionicons name="call" size={18} color="#fff" />}
            onPress={() => Linking.openURL(`tel:${oficina.telefone}`)}
          />
        ) : null}
      </View>
    </View>
  );
}
