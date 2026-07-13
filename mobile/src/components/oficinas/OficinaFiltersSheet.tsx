import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetSection } from '@/components/ui/SheetSection';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { getDistritos } from '@/lib/geo';
import { useCountry } from '@/context/CountryContext';
import { ESPECIALIDADES_LABELS, type EspecialidadeOficina } from '@/types';

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
  const { country } = useCountry();
  const distritoOpts = [{ value: '', label: 'Todos' }, ...getDistritos(country).map((d) => ({ value: d, label: d }))];
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
      <SheetSection title={country === 'BR' ? 'Estado' : 'Distrito'}>
        <ChipSelect options={distritoOpts} value={distrito} onChange={setDistrito} />
      </SheetSection>
    </BottomSheet>
  );
}
