import { Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { DISTRITOS } from '@/lib/constants';

const DISTRITO_OPTS = [{ value: '', label: 'Todos' }, ...DISTRITOS.map((d) => ({ value: d, label: d }))];
const ESTADO_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'pronto', label: 'Pronto a andar' },
  { value: 'manutencao', label: 'Para reparar' },
];

interface CarFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  precoMin: string;
  setPrecoMin: (v: string) => void;
  precoMax: string;
  setPrecoMax: (v: string) => void;
  distrito: string;
  setDistrito: (v: string) => void;
  estado: string;
  setEstado: (v: string) => void;
  onClear: () => void;
  resultCount: number;
}

export function CarFiltersSheet({
  visible,
  onClose,
  precoMin,
  setPrecoMin,
  precoMax,
  setPrecoMax,
  distrito,
  setDistrito,
  estado,
  setEstado,
  onClear,
  resultCount,
}: CarFiltersSheetProps) {
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
      <View>
        <Text className="mb-1.5 text-sm font-semibold text-fg-muted">Preço (€)</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input value={precoMin} onChangeText={setPrecoMin} placeholder="Mínimo" keyboardType="number-pad" />
          </View>
          <View className="flex-1">
            <Input value={precoMax} onChangeText={setPrecoMax} placeholder="Máximo" keyboardType="number-pad" />
          </View>
        </View>
      </View>

      <ChipSelect label="Estado" options={ESTADO_OPTS} value={estado} onChange={setEstado} />
      <ChipSelect label="Distrito" options={DISTRITO_OPTS} value={distrito} onChange={setDistrito} />
    </BottomSheet>
  );
}
