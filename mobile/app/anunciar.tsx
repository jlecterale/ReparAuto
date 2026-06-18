import { View } from 'react-native';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function AnunciarScreen() {
  return (
    <View className="flex-1 bg-neutral-50">
      <ComingSoon
        icon="add-circle"
        titulo="Publicar anúncio"
        texto="O assistente para anunciar o seu carro — com câmara e upload de fotos — chega na Fase 3."
      />
    </View>
  );
}
