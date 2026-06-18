import { Screen } from '@/components/ui/Screen';
import { ComingSoon } from '@/components/ui/ComingSoon';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function FavoritosScreen() {
  return (
    <Screen>
      <SectionHeader title="Favoritos" />
      <ComingSoon
        icon="heart"
        titulo="Os seus favoritos"
        texto="Guarde anúncios e encontre-os aqui. Disponível na próxima fase."
      />
    </Screen>
  );
}
