import { Screen } from '@/components/ui/Screen';
import { ComingSoon } from '@/components/ui/ComingSoon';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function OficinasScreen() {
  return (
    <Screen>
      <SectionHeader title="Oficinas" />
      <ComingSoon
        icon="business"
        titulo="Diretório de oficinas"
        texto="Encontre oficinas perto de si, com mapa e avaliações, em breve."
      />
    </Screen>
  );
}
