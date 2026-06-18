import { Screen } from '@/components/ui/Screen';
import { ComingSoon } from '@/components/ui/ComingSoon';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function PecasScreen() {
  return (
    <Screen>
      <SectionHeader title="Peças" />
      <ComingSoon
        icon="construct"
        titulo="Marketplace de peças"
        texto="A listagem e pesquisa de peças usadas chega na próxima fase."
      />
    </Screen>
  );
}
