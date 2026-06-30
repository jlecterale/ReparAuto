import { Alert, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { colors } from '@/theme/colors';

interface PhotoPickerProps {
  fotos: string[];
  onChange: (fotos: string[]) => void;
  max: number;
}

export function PhotoPicker({ fotos, onChange, max }: PhotoPickerProps) {
  const restantes = max - fotos.length;
  // Long-press drag to reorder only makes sense with 2+ photos.
  const reordenavel = max > 1 && fotos.length > 1;

  async function escolherDaGaleria() {
    // The system Photo Picker (Android 13+ / iOS PHPicker) needs no permission.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: max > 1,
      selectionLimit: restantes,
      quality: 0.7,
    });
    if (!result.canceled) {
      onChange([...fotos, ...result.assets.map((a) => a.uri)].slice(0, max));
    }
  }

  async function tirarFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à câmara nas Definições.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      onChange([...fotos, result.assets[0].uri].slice(0, max));
    }
  }

  function adicionar() {
    if (restantes <= 0) {
      Alert.alert('Limite atingido', `Máximo de ${max} fotos.`);
      return;
    }
    Alert.alert('Adicionar foto', undefined, [
      { text: 'Tirar foto', onPress: tirarFoto },
      { text: 'Escolher da galeria', onPress: escolherDaGaleria },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function remover(uri: string) {
    onChange(fotos.filter((f) => f !== uri));
  }

  function renderItem({ item: uri, getIndex, drag, isActive }: RenderItemParams<string>) {
    const isCapa = getIndex() === 0;
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={reordenavel ? drag : undefined}
          disabled={isActive}
          delayLongPress={150}
          accessibilityRole="image"
          accessibilityLabel={reordenavel ? 'Manter premido para reordenar' : undefined}
          className={`mr-2 ${isActive ? 'opacity-80' : ''}`}
        >
          <Image source={uri} style={{ width: 96, height: 96, borderRadius: 12 }} contentFit="cover" />
          {isCapa && (
            <View className="absolute bottom-1 left-1 rounded bg-primary-900/90 px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">Capa</Text>
            </View>
          )}
          <Pressable
            onPress={() => remover(uri)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remover foto"
            className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-danger-600"
          >
            <Ionicons name="close" size={14} color="#fff" />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  }

  return (
    <View>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-fg-muted">
          Fotos <Text className="text-danger-600">*</Text>
        </Text>
        <Text className="text-xs text-fg-subtle">
          {fotos.length}/{max}
        </Text>
      </View>

      <DraggableFlatList
        data={fotos}
        horizontal
        keyExtractor={(uri) => uri}
        onDragEnd={({ data }) => onChange(data)}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        activationDistance={12}
        ListHeaderComponent={
          <Pressable
            onPress={adicionar}
            accessibilityRole="button"
            accessibilityLabel="Adicionar foto"
            className="mr-2 h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white"
          >
            <Ionicons name="camera" size={26} color={colors.primary[600]} />
            <Text className="mt-1 text-xs font-semibold text-primary-600">Adicionar</Text>
          </Pressable>
        }
      />

      {reordenavel && (
        <Text className="mt-1.5 text-xs text-fg-subtle">
          Mantenha premida uma foto para arrastar e reordenar. A primeira é a capa.
        </Text>
      )}
    </View>
  );
}
