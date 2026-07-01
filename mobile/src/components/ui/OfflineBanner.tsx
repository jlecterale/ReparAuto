import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkState } from 'expo-network';
import { Ionicons } from '@expo/vector-icons';

/** Slim banner shown when the device loses connectivity. */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const net = useNetworkState();
  // Treat as offline only when we positively know there is no connection.
  const offline = net.isConnected === false || net.isInternetReachable === false;

  if (!offline) return null;

  return (
    <View style={{ paddingTop: insets.top }} className="bg-neutral-800">
      <View className="flex-row items-center justify-center py-1.5">
        <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
        <Text className="ml-1.5 text-xs font-semibold text-white">
          Sem ligação — algumas funções podem estar indisponíveis
        </Text>
      </View>
    </View>
  );
}
