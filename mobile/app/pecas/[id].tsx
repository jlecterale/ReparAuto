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
import { OwnerStats } from '@/components/ui/OwnerStats';
import { PhotoViewer } from '@/components/ui/PhotoViewer';
import { getPecaById, registarVisualizacao } from '@/lib/db';
import { formatPrecoOpcional } from '@/lib/format';
import { docCountry } from '@/lib/country';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { TIPO_PECA_LABELS, type Peca } from '@/types';
import { colors } from '@/theme/colors';

export default function DetalhesPecaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [peca, setPeca] = useState<Peca | null>(null);
  const [loading, setLoading] = useState(true);
  const [visorAberto, setVisorAberto] = useState(false);

  useEffect(() => {
    let active = true;
    getPecaById(id)
      .then((p) => {
        if (!active) return;
        setPeca(p);
        // Count the view for everyone except the owner.
        if (p && p.criadorUid !== user?.uid) registarVisualizacao('parts', id);
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

  if (!peca) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-8">
        <Ionicons name="alert-circle-outline" size={56} color={colors.neutral[300]} />
        <Text className="mt-3 text-lg font-bold text-fg-heading">Peça não encontrada</Text>
      </View>
    );
  }

  const tel = peca.vendedorTelefone || peca.contacto;
  const ehDono = !!peca.criadorUid && peca.criadorUid === user?.uid;
  const podeMensagem = !!peca.criadorUid && peca.criadorUid !== user?.uid;

  return (
    <View className="flex-1 bg-neutral-50">
      <Stack.Screen
        options={{
          title: peca.titulo,
          headerRight: () => (
            <Ionicons
              name="flag-outline"
              size={20}
              color={colors.danger[600]}
              onPress={() =>
                requireAuth(() =>
                  router.push({
                    pathname: '/denunciar',
                    params: { alvoId: peca.id, alvoTipo: 'peca', titulo: peca.titulo },
                  }),
                )
              }
            />
          ),
        }}
      />
      <ScrollView contentContainerClassName="pb-28">
        {peca.foto ? (
          <View>
            <Pressable
              onPress={() => setVisorAberto(true)}
              accessibilityRole="imagebutton"
              accessibilityLabel="Ampliar foto"
            >
              <Image
                source={peca.foto}
                style={{ width, height: width * 0.72 }}
                contentFit="cover"
                transition={200}
              />
            </Pressable>
            <View className="absolute bottom-3 right-3 rounded-full bg-black/55 p-1.5">
              <Ionicons name="expand-outline" size={14} color="#fff" />
            </View>
          </View>
        ) : (
          <View
            style={{ width, height: width * 0.6 }}
            className="items-center justify-center bg-neutral-200"
          >
            <Ionicons name="cube-outline" size={48} color={colors.neutral[400]} />
          </View>
        )}

        <View className="p-4">
          <View className="self-start rounded bg-primary-100 px-2 py-0.5">
            <Text className="text-xs font-bold text-primary-700">
              {TIPO_PECA_LABELS[peca.tipo]}
            </Text>
          </View>
          <Text className="mt-2 text-2xl font-extrabold text-fg-heading">{peca.titulo}</Text>
          <Text className="mt-1 text-3xl font-black text-accent">
            {formatPrecoOpcional(peca.preco, docCountry(peca))}
          </Text>

          {ehDono && (
            <View className="mt-4">
              <Text className="mb-2 text-sm font-bold text-fg-heading">As suas estatísticas</Text>
              <OwnerStats
                variant="card"
                visualizacoes={peca.visualizacoes}
                contagemMensagens={peca.contagemMensagens}
              />
            </View>
          )}

          <View className="mt-5 flex-row flex-wrap">
            <Spec icon="pricetag-outline" label="Categoria" value={peca.categoria} />
            <Spec icon="car-outline" label="Marca" value={peca.marcaCarro} />
            {!!peca.modeloCarro && (
              <Spec icon="car-sport-outline" label="Modelo" value={peca.modeloCarro} />
            )}
            <Spec icon="ribbon-outline" label="Estado" value={peca.estado} />
            <Spec icon="location-outline" label="Local" value={peca.local} />
          </View>

          {!!peca.descricao && (
            <View className="mt-5">
              <Text className="mb-2 text-lg font-bold text-fg-heading">Descrição</Text>
              <Text className="text-base leading-6 text-fg">{peca.descricao}</Text>
            </View>
          )}
        </View>
      </ScrollView>

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
                    listingId: peca.id,
                    listingType: 'peca',
                    listingTitle: peca.titulo,
                    outroUid: peca.criadorUid!,
                    outroNome: peca.vendedorNome || 'Vendedor',
                  },
                }),
              )
            }
          />
        ) : null}
        {peca.vendedorWhatsApp ? (
          <Button
            label="WhatsApp"
            variant="secondary"
            className="flex-1"
            icon={<Ionicons name="logo-whatsapp" size={18} color="#fff" />}
            onPress={() => Linking.openURL(`https://wa.me/${peca.vendedorWhatsApp}`)}
          />
        ) : null}
        {tel ? (
          <Button
            label="Ligar"
            variant="outline"
            className="flex-1"
            icon={<Ionicons name="call" size={18} color={colors.primary[700]} />}
            onPress={() => Linking.openURL(`tel:${tel}`)}
          />
        ) : null}
      </View>

      {peca.foto && (
        <PhotoViewer
          visible={visorAberto}
          fotos={[peca.foto]}
          onClose={() => setVisorAberto(false)}
        />
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
