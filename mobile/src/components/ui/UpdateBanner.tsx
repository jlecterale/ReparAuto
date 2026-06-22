import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppUpdate } from '@/hooks/useAppUpdate';

const DISMISS_KEY = 'update_banner_dismissed_version';

/**
 * Top banner shown when a newer app version is published (see `useAppUpdate`).
 * Optional updates can be dismissed per version (persisted in AsyncStorage so
 * it doesn't nag every launch); mandatory updates (below `minVersion`) cannot
 * be dismissed.
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const update = useAppUpdate();
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISMISS_KEY)
      .then((v) => setDismissedVersion(v))
      .finally(() => setHydrated(true));
  }, []);

  if (!update || !hydrated) return null;
  if (!update.required && dismissedVersion === update.latestVersion) return null;

  function atualizar() {
    if (update) Linking.openURL(update.url).catch(() => {});
  }

  function dispensar() {
    if (!update) return;
    setDismissedVersion(update.latestVersion);
    AsyncStorage.setItem(DISMISS_KEY, update.latestVersion).catch(() => {});
  }

  return (
    <View style={{ paddingTop: insets.top }} className="bg-primary-700">
      <View className="flex-row items-center px-3 py-2">
        <Ionicons name="rocket-outline" size={18} color="#fff" />
        <View className="ml-2 flex-1">
          <Text className="text-xs font-bold text-white">
            {update.required ? 'Atualização obrigatória' : 'Nova atualização disponível'}
          </Text>
          <Text className="text-[11px] text-white/90" numberOfLines={2}>
            {update.mensagem ??
              (update.required
                ? 'Atualize para continuar a usar a app.'
                : `A versão ${update.latestVersion} já está disponível.`)}
          </Text>
        </View>
        <Pressable
          onPress={atualizar}
          accessibilityRole="button"
          accessibilityLabel="Atualizar a app"
          className="ml-2 rounded-full bg-white px-3 py-1.5 active:opacity-80"
        >
          <Text className="text-xs font-bold text-primary-700">Atualizar</Text>
        </Pressable>
        {!update.required && (
          <Pressable
            onPress={dispensar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dispensar"
            className="ml-1 p-1"
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
