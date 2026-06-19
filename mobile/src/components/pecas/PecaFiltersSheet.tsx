import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { CATEGORIAS_PECAS, DISTRITOS, ESTADOS_PECA } from '@/lib/constants';

const CATEGORIA_OPTS = [{ value: '', label: 'Todas' }, ...CATEGORIAS_PECAS.map((c) => ({ value: c, label: c }))];
const ESTADO_OPTS = [{ value: '', label: 'Todos' }, ...ESTADOS_PECA.map((e) => ({ value: e, label: e }))];
const DISTRITO_OPTS = [{ value: '', label: 'Todos' }, ...DISTRITOS.map((d) => ({ value: d, label: d }))];

interface PecaFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  categoria: string;
  setCategoria: (v: string) => void;
  estado: string;
  setEstado: (v: string) => void;
  distrito: string;
  setDistrito: (v: string) => void;
  onClear: () => void;
  resultCount: number;
}

export function PecaFiltersSheet({
  visible,
  onClose,
  categoria,
  setCategoria,
  estado,
  setEstado,
  distrito,
  setDistrito,
  onClear,
  resultCount,
}: PecaFiltersSheetProps) {
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
      <ChipSelect label="Categoria" options={CATEGORIA_OPTS} value={categoria} onChange={setCategoria} />
      <ChipSelect label="Estado" options={ESTADO_OPTS} value={estado} onChange={setEstado} />
      <ChipSelect label="Distrito" options={DISTRITO_OPTS} value={distrito} onChange={setDistrito} />
    </BottomSheet>
  );
}
