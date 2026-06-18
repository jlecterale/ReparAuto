import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function PerfilScreen() {
  const { user, logout } = useAuth();

  function confirmarLogout() {
    Alert.alert('Terminar sessão', 'Tem a certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
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
            <View className="h-22 w-22 items-center justify-center rounded-full bg-primary-100" style={{ width: 88, height: 88 }}>
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

        <View className="mt-2 overflow-hidden rounded-2xl bg-white">
          <Row icon="car-sport-outline" label="Os meus anúncios" />
          <Row icon="document-text-outline" label="As minhas intenções" />
          <Row icon="chatbubble-ellipses-outline" label="Mensagens" />
          <Row icon="settings-outline" label="Definições" last />
        </View>

        <View className="mt-6">
          <Button
            label="Terminar sessão"
            variant="outline"
            onPress={confirmarLogout}
            icon={<Ionicons name="log-out-outline" size={18} color={colors.primary[700]} />}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({
  icon,
  label,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  last?: boolean;
}) {
  return (
    <Pressable
      className={`flex-row items-center px-4 py-4 active:bg-neutral-50 ${
        last ? '' : 'border-b border-neutral-100'
      }`}
    >
      <Ionicons name={icon} size={20} color={colors.primary[600]} />
      <Text className="ml-3 flex-1 text-base font-medium text-fg">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
    </Pressable>
  );
}
