import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAdminPendencias } from '@/hooks/useAdminPendencias';
import { REQUIRES_RECENT_LOGIN } from '@/lib/auth';
import { colors } from '@/theme/colors';

export default function PerfilScreen() {
  const { user, isAdmin, logout, eliminarConta } = useAuth();
  const { showToast } = useToast();
  const { total: pendenciasAdmin } = useAdminPendencias(isAdmin);

  function confirmarLogout() {
    Alert.alert('Terminar sessão', 'Tem a certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  }

  function confirmarEliminar() {
    Alert.alert(
      'Eliminar conta',
      'Esta ação é permanente e remove o seu perfil e os seus dados. Tem a certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarConta();
            } catch (e) {
              const code = (e as { code?: string })?.code;
              if (code === REQUIRES_RECENT_LOGIN) {
                showToast('Por segurança, inicie sessão novamente e tente de novo.', 'error');
                await logout();
              } else {
                showToast('Não foi possível eliminar a conta.', 'error');
              }
            }
          },
        },
      ],
    );
  }

  if (!user) {
    return (
      <Screen>
        <SectionHeader title="Perfil" />
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-primary-50">
            <Ionicons name="person-circle-outline" size={44} color={colors.primary[600]} />
          </View>
          <Text className="text-2xl font-extrabold text-fg-heading">Bem-vindo</Text>
          <Text className="mb-6 mt-2 text-center text-base text-fg-muted">
            Inicie sessão para guardar favoritos, anunciar e contactar vendedores.
          </Text>
          <View className="w-full">
            <Button label="Entrar ou criar conta" onPress={() => router.push('/login')} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader title="Perfil" />
      <ScrollView contentContainerClassName="p-4">
        <View className="items-center py-6">
          {user?.foto ? (
            <Image
              source={user.foto}
              style={{ width: 88, height: 88, borderRadius: 44 }}
              contentFit="cover"
            />
          ) : (
            <View
              className="items-center justify-center rounded-full bg-primary-100"
              style={{ width: 88, height: 88 }}
            >
              <Ionicons name="person" size={40} color={colors.primary[600]} />
            </View>
          )}
          <Text className="mt-3 text-xl font-extrabold text-fg-heading">
            {user?.nome ?? 'Utilizador'}
          </Text>
          <Text className="text-fg-muted">{user?.email}</Text>
          {user?.verificado && (
            <View className="mt-2 flex-row items-center rounded-full bg-success-100 px-3 py-1">
              <Ionicons name="shield-checkmark" size={14} color={colors.success[600]} />
              <Text className="ml-1 text-xs font-bold text-success-700">Verificado</Text>
            </View>
          )}
        </View>

        {!user.profileCompleted && (
          <Pressable
            onPress={() => router.push('/perfil/editar')}
            accessibilityRole="button"
            className="mb-3 flex-row items-center rounded-2xl border border-secondary-200 bg-secondary-50 p-4 active:opacity-90"
          >
            <Ionicons name="alert-circle" size={22} color={colors.secondary[600]} />
            <View className="ml-3 flex-1">
              <Text className="font-bold text-secondary-700">Complete o seu perfil</Text>
              <Text className="text-sm text-secondary-700/80">
                Adicione contacto e localização para anunciar e ser contactado.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.secondary[600]} />
          </Pressable>
        )}

        <View className="mt-2 overflow-hidden rounded-2xl bg-white">
          <Row
            icon="car-sport-outline"
            label="Os meus anúncios"
            onPress={() => router.push('/meus-anuncios')}
          />
          <Row
            icon="search-outline"
            label="Procuras de compradores"
            onPress={() => router.push('/intencoes')}
          />
          <Row icon="heart-outline" label="Favoritos" onPress={() => router.push('/favoritos')} />
          <Row
            icon="notifications-outline"
            label="Notificações"
            onPress={() => router.push('/notificacoes')}
          />
          <Row
            icon="create-outline"
            label="Editar perfil"
            onPress={() => router.push('/perfil/editar')}
          />
          {isAdmin && (
            <Row
              icon="shield-checkmark-outline"
              label="Painel Admin"
              badge={pendenciasAdmin}
              onPress={() => router.push('/admin')}
            />
          )}
          <Row
            icon="settings-outline"
            label="Definições"
            onPress={() => router.push('/definicoes')}
            last
          />
        </View>

        <View className="mt-6 gap-3">
          <Button
            label="Terminar sessão"
            variant="outline"
            onPress={confirmarLogout}
            icon={<Ionicons name="log-out-outline" size={18} color={colors.primary[700]} />}
          />
          <Pressable onPress={confirmarEliminar} className="py-2" accessibilityRole="button">
            <Text className="text-center font-semibold text-danger-600">Eliminar conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({
  icon,
  label,
  last,
  badge,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  last?: boolean;
  badge?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-center px-4 py-4 active:bg-neutral-50 ${
        last ? '' : 'border-b border-neutral-100'
      }`}
    >
      <Ionicons name={icon} size={20} color={colors.primary[600]} />
      <Text className="ml-3 flex-1 text-base font-medium text-fg">{label}</Text>
      {!!badge && badge > 0 && (
        <View className="mr-2 min-w-[24px] items-center rounded-full bg-danger-500 px-2 py-0.5">
          <Text className="text-xs font-bold text-white">{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
    </Pressable>
  );
}
