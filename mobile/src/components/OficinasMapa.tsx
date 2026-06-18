import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import type { Oficina } from '@/types';
import { colors } from '@/theme/colors';

// Centred on mainland Portugal by default.
const REGIAO_PT: Region = {
  latitude: 39.6,
  longitude: -8.0,
  latitudeDelta: 4.5,
  longitudeDelta: 4.5,
};

interface OficinasMapaProps {
  oficinas: Oficina[];
  onSelect: (id: string) => void;
}

export function OficinasMapa({ oficinas, onSelect }: OficinasMapaProps) {
  const mapRef = useRef<MapView>(null);
  const [locating, setLocating] = useState(false);

  const comCoords = oficinas.filter(
    (o) => o.coordenadas?.latitude != null && o.coordenadas?.longitude != null,
  );

  async function irParaMim() {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      });
    } catch {
      // ignore
    } finally {
      setLocating(false);
    }
  }

  return (
    <View className="flex-1">
      <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={REGIAO_PT}>
        {comCoords.map((o) => (
          <Marker
            key={o.id}
            coordinate={{
              latitude: o.coordenadas!.latitude,
              longitude: o.coordenadas!.longitude,
            }}
            title={o.nome}
            description={[o.localidade, o.distrito].filter(Boolean).join(', ')}
            pinColor={colors.primary[600]}
            onCalloutPress={() => onSelect(o.id)}
          />
        ))}
      </MapView>

      <Pressable
        onPress={irParaMim}
        accessibilityRole="button"
        accessibilityLabel="A minha localização"
        className="absolute bottom-5 right-4 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg"
      >
        <Ionicons
          name={locating ? 'sync' : 'locate'}
          size={22}
          color={colors.primary[600]}
        />
      </Pressable>
    </View>
  );
}
