import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { VideoPreview } from '@/components/ui/VideoPreview';
import { getOficinaById } from '@/lib/db';
import { subscribeReviews } from '@/lib/trust';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ESPECIALIDADES_LABELS, type Oficina, type Review } from '@/types';
import { colors } from '@/theme/colors';

export default function DetalhesOficinaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const requireAuth = useRequireAuth();
  const [oficina, setOficina] = useState<Oficina | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeReviews(id, setReviews, () => {});
    return unsub;
  }, [id]);

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
  // Universal Google Maps link — opens the Maps app if installed, else the
  // browser. Needs no API key. Prefer exact coordinates, fall back to the
  // address text.
  const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    oficina.coordenadas
      ? `${oficina.coordenadas.latitude},${oficina.coordenadas.longitude}`
      : morada,
  )}`;

  return (
    <View className="flex-1 bg-neutral-50">
      <Stack.Screen
        options={{
          title: oficina.nome,
          headerRight: () => (
            <Ionicons
              name="flag-outline"
              size={20}
              color={colors.danger[600]}
              onPress={() =>
                requireAuth(() =>
                  router.push({
                    pathname: '/denunciar',
                    params: { alvoId: oficina.id, alvoTipo: 'utilizador', titulo: oficina.nome },
                  }),
                )
              }
            />
          ),
        }}
      />
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

          {!!oficina.videoUrl && (
            <View className="mt-5">
              <Text className="mb-2 text-lg font-bold text-fg-heading">Vídeo</Text>
              <VideoPreview url={oficina.videoUrl} />
            </View>
          )}

          {!!morada && (
            <Pressable
              onPress={() => Linking.openURL(mapaUrl)}
              accessibilityRole="button"
              accessibilityLabel="Abrir morada no Google Maps"
              className="mt-5 flex-row items-start active:opacity-60"
            >
              <Ionicons name="location-outline" size={18} color={colors.primary[600]} />
              <Text className="ml-2 flex-1 text-base text-fg">{morada}</Text>
              <Text className="ml-2 mt-0.5 text-sm font-semibold text-primary-700">Ver no mapa</Text>
            </Pressable>
          )}

          {/* Avaliações */}
          <View className="mt-6 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-fg-heading">Avaliações</Text>
            <Button
              label="Avaliar"
              variant="outline"
              className="px-3 py-2"
              onPress={() =>
                requireAuth(() =>
                  router.push({
                    pathname: '/avaliar',
                    params: {
                      anuncioId: oficina.id,
                      anuncioTipo: 'oficina',
                      vendedorUid: oficina.criador,
                      vendedorEmail: oficina.criador,
                      titulo: oficina.nome,
                    },
                  }),
                )
              }
            />
          </View>
          {reviews.length === 0 ? (
            <Text className="mt-2 text-sm text-fg-subtle">Ainda sem avaliações. Seja o primeiro.</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} className="mt-3 rounded-xl bg-white p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bold text-fg-heading">{r.autorNome}</Text>
                  <StarRating value={r.nota} size={14} />
                </View>
                {!!r.comentario && <Text className="mt-1 text-sm text-fg-muted">{r.comentario}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-neutral-200 bg-white px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
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
