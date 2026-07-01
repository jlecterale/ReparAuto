import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetSection } from '@/components/ui/SheetSection';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { DISTRITOS } from '@/lib/constants';
import { ESPECIALIDADES_LABELS, type EspecialidadeOficina } from '@/types';

const DISTRITO_OPTS = [{ value: '', label: 'Todos' }, ...DISTRITOS.map((d) => ({ value: d, label: d }))];
const ESPECIALIDADE_OPTS = [
  { value: '', label: 'Todas' },
  ...(Object.keys(ESPECIALIDADES_LABELS) as EspecialidadeOficina[]).map((e) => ({
    value: e,
    label: ESPECIALIDADES_LABELS[e],
  })),
];

interface OficinaFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  distrito: string;
  setDistrito: (v: string) => void;
  especialidade: string;
  setEspecialidade: (v: string) => void;
  onClear: () => void;
  resultCount: number;
}

export function OficinaFiltersSheet({
  visible,
  onClose,
  distrito,
  setDistrito,
  especialidade,
  setEspecialidade,
  onClear,
  resultCount,
}: OficinaFiltersSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filtros"
      footer={
        <>
          <Button label="Limpar" variant="outline" className="flex-1" onPress={onClear} />
          <Button label={`Ver ${resultCount}`} className="flex-[2]" onPress={onClose} />
        </>
      }
    >
      <SheetSection title="Especialidade" first>
        <ChipSelect options={ESPECIALIDADE_OPTS} value={especialidade} onChange={setEspecialidade} />
      </SheetSection>
      <SheetSection title="Distrito">
        <ChipSelect options={DISTRITO_OPTS} value={distrito} onChange={setDistrito} />
      </SheetSection>
    </BottomSheet>
  );
}
