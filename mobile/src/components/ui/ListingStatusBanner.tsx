import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

/**
 * Owner-only moderation-state banner for listing detail screens. A pending or
 * rejected listing looks exactly like an approved one when the owner opens it,
 * so this makes the state explicit: pending → only the owner can see it until
 * the team approves; rejected → not public, edit and resubmit. Renders nothing
 * for approved/active listings or for viewers who don't own the listing.
 */
export function ListingStatusBanner({ status, isOwner }: { status: string; isOwner: boolean }) {
  if (!isOwner) return null;

  if (status === 'pendente') {
    return (
      <View className="mb-4 flex-row items-start rounded-2xl border border-warning-200 bg-warning-50 p-3">
        <Ionicons name="time-outline" size={20} color={colors.warning[500]} style={{ marginTop: 1 }} />
        <View className="ml-2.5 flex-1">
          <Text className="text-sm font-bold text-warning-800">Em revisão</Text>
          <Text className="mt-0.5 text-sm leading-5 text-warning-800">
            Por agora só é visível para si. Fica público assim que for aprovado pela equipa.
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'rejeitado') {
    return (
      <View className="mb-4 flex-row items-start rounded-2xl border border-danger-200 bg-danger-50 p-3">
        <Ionicons name="close-circle-outline" size={20} color={colors.danger[600]} style={{ marginTop: 1 }} />
        <View className="ml-2.5 flex-1">
          <Text className="text-sm font-bold text-danger-700">Rejeitado</Text>
          <Text className="mt-0.5 text-sm leading-5 text-danger-700">
            Não foi aprovado pela equipa e não está visível ao público. Pode editar e voltar a
            submeter em Perfil → Os meus anúncios.
          </Text>
        </View>
      </View>
    );
  }

  return null;
}
