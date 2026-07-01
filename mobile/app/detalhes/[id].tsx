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
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { OwnerStats } from '@/components/ui/OwnerStats';
import { PhotoViewer } from '@/components/ui/PhotoViewer';
import { VideoPreview } from '@/components/ui/VideoPreview';
import { getCarroById, registarVisualizacao } from '@/lib/db';
import { formatKm, formatPreco } from '@/lib/format';
import { docCountry } from '@/lib/country';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import type { Carro } from '@/types';
import { colors } from '@/theme/colors';

export default function DetalhesCarroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [carro, setCarro] = useState<Carro | null>(null);
  const [loading, setLoading] = useState(true);
  const [visorAberto, setVisorAberto] = useState(false);
  const [indiceVisor, setIndiceVisor] = useState(0);

  useEffect(() => {
    let active = true;
    getCarroById(id)
      .then((c) => {
        if (!active) return;
        setCarro(c);
        // Count the view for everyone except the owner.
        if (c && c.criadorUid !== user?.uid) registarVisualizacao('cars', id);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, user?.uid]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  if (!carro) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-8">
        <Ionicons name="alert-circle-outline" size={56} color={colors.neutral[300]} />
        <Text className="mt-3 text-lg font-bold text-fg-heading">Anúncio não encontrado</Text>
      </View>
    );
  }

  const fotos = carro.fotos?.length ? carro.fotos : [];
  const ehDono = !!carro.criadorUid && carro.criadorUid === user?.uid;
  const podeMensagem = !!carro.criadorUid && carro.criadorUid !== user?.uid;

  return (
    <View className="flex-1 bg-neutral-50">
      <Stack.Screen
        options={{
          title: `${carro.marca} ${carro.modelo}`,
          headerRight: () => (
            <View className="flex-row items-center gap-4">
              <Ionicons
                name="flag-outline"
                size={20}
                color={colors.danger[600]}
                onPress={() =>
                  requireAuth(() =>
                    router.push({
                      pathname: '/denunciar',
                      params: {
                        alvoId: carro.id,
                        alvoTipo: 'carro',
                        titulo: `${carro.marca} ${carro.modelo}`,
                      },
                    }),
                  )
                }
              />
              <FavoriteButton id={carro.id} />
            </View>
          ),
        }}
      />
      <ScrollView contentContainerClassName="pb-28">
        {/* Gallery */}
        <View>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {fotos.map((url, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  setIndiceVisor(i);
                  setVisorAberto(true);
                }}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Ampliar foto ${i + 1}`}
              >
                <Image
                  source={url}
                  style={{ width, height: width * 0.72 }}
                  contentFit="cover"
                  transition={200}
                />
              </Pressable>
            ))}
            {fotos.length === 0 && (
              <View
                style={{ width, height: width * 0.72 }}
                className="items-center justify-center bg-neutral-200"
              >
                <Ionicons name="image-outline" size={48} color={colors.neutral[400]} />
              </View>
            )}
          </ScrollView>
          {fotos.length > 0 && (
            <View className="absolute bottom-3 right-3 flex-row items-center gap-1 rounded-full bg-black/55 px-2.5 py-1">
              <Ionicons name="expand-outline" size={13} color="#fff" />
              <Text className="text-xs font-semibold text-white">{fotos.length}</Text>
            </View>
          )}
        </View>

        <View className="p-4">
          <Text className="text-2xl font-extrabold text-fg-heading">
            {carro.marca} {carro.modelo}
          </Text>
          <Text className="mt-1 text-3xl font-black text-accent">
            {formatPreco(carro.preco, docCountry(carro))}
          </Text>

          {ehDono && (
            <View className="mt-4">
              <Text className="mb-2 text-sm font-bold text-fg-heading">As suas estatísticas</Text>
              <OwnerStats
                variant="card"
                visualizacoes={carro.visualizacoes}
                contagemMensagens={carro.contagemMensagens}
                contagemFavoritos={carro.contagemFavoritos ?? 0}
              />
            </View>
          )}

          {/* Specs */}
          <View className="mt-5 flex-row flex-wrap">
            <Spec icon="calendar-outline" label="Ano" value={String(carro.anoFabricacao)} />
            <Spec icon="speedometer-outline" label="Quilómetros" value={formatKm(carro.km)} />
            <Spec icon="water-outline" label="Combustível" value={carro.combustivel} />
            <Spec icon="cog-outline" label="Caixa" value={carro.cambio} />
            <Spec icon="color-palette-outline" label="Cor" value={carro.cor} />
            <Spec icon="location-outline" label="Local" value={carro.local} />
          </View>

          {!!carro.descricao && (
            <View className="mt-5">
              <Text className="mb-2 text-lg font-bold text-fg-heading">Descrição</Text>
              <Text className="text-base leading-6 text-fg">{carro.descricao}</Text>
            </View>
          )}

          {!!carro.videoUrl && (
            <View className="mt-5">
              <Text className="mb-2 text-lg font-bold text-fg-heading">Vídeo</Text>
              <VideoPreview url={carro.videoUrl} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Contact bar */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-neutral-200 bg-white px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        {podeMensagem ? (
          <Button
            label="Mensagem"
            className="flex-1"
            icon={<Ionicons name="chatbubble-ellipses" size={18} color="#fff" />}
            onPress={() =>
              requireAuth(() =>
                router.push({
                  pathname: '/chat/[listingId]',
                  params: {
                    listingId: carro.id,
                    listingType: 'carro',
                    listingTitle: `${carro.marca} ${carro.modelo}`,
                    outroUid: carro.criadorUid!,
                    outroNome: carro.vendedorNome || 'Vendedor',
                  },
                }),
              )
            }
          />
        ) : null}
        {carro.vendedorWhatsApp ? (
          <Button
            label="WhatsApp"
            variant="secondary"
            className="flex-1"
            icon={<Ionicons name="logo-whatsapp" size={18} color="#fff" />}
            onPress={() => Linking.openURL(`https://wa.me/${carro.vendedorWhatsApp}`)}
          />
        ) : null}
        {carro.vendedorTelefone ? (
          <Button
            label="Ligar"
            variant="outline"
            className="flex-1"
            icon={<Ionicons name="call" size={18} color={colors.primary[700]} />}
            onPress={() => Linking.openURL(`tel:${carro.vendedorTelefone}`)}
          />
        ) : null}
      </View>

      <PhotoViewer
        visible={visorAberto}
        fotos={fotos}
        initialIndex={indiceVisor}
        onClose={() => setVisorAberto(false)}
      />
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
