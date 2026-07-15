import { useMemo } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetSection } from '@/components/ui/SheetSection';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { SelectField } from '@/components/ui/SelectField';
import { useMarcasModelos } from '@/hooks/useMarcasModelos';
import { CATEGORIAS_PECAS, ESTADOS_PECA } from '@/lib/constants';
import { getDistritos } from '@/lib/geo';
import { useCountry } from '@/context/CountryContext';

const CATEGORIA_OPTS = [{ value: '', label: 'Todas' }, ...CATEGORIAS_PECAS.map((c) => ({ value: c, label: c }))];
const ESTADO_OPTS = [{ value: '', label: 'Todos' }, ...ESTADOS_PECA.map((e) => ({ value: e, label: e }))];

interface PecaFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  categoria: string;
  setCategoria: (v: string) => void;
  estado: string;
  setEstado: (v: string) => void;
  distrito: string;
  setDistrito: (v: string) => void;
  bairro: string;
  setBairro: (v: string) => void;
  /** Neighbourhoods that actually have listings (BR only). */
  bairroOpts: string[];
  marca: string;
  setMarca: (v: string) => void;
  modelo: string;
  setModelo: (v: string) => void;
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
  bairro,
  setBairro,
  bairroOpts,
  marca,
  setMarca,
  modelo,
  setModelo,
  onClear,
  resultCount,
}: PecaFiltersSheetProps) {
  const { country } = useCountry();
  const { marcas, getModelos, loading: marcasLoading } = useMarcasModelos();
  const modelos = useMemo(() => getModelos(marca), [getModelos, marca]);
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
      <SheetSection title="Marca e modelo do carro" first>
        <View className="gap-3">
          <SelectField
            value={marca}
            onChange={(v) => {
              setMarca(v);
              setModelo('');
            }}
            options={marcas}
            loading={marcasLoading}
            placeholder="Todas as marcas"
            title="Marca"
            emptyOption="Todas as marcas"
          />
          {!!marca && (
            <SelectField
              value={modelo}
              onChange={setModelo}
              options={modelos}
              placeholder="Todos os modelos"
              title="Modelo"
              emptyOption="Todos os modelos"
            />
          )}
        </View>
      </SheetSection>

      <SheetSection title="Categoria">
        <ChipSelect options={CATEGORIA_OPTS} value={categoria} onChange={setCategoria} />
      </SheetSection>
      <SheetSection title="Estado">
        <ChipSelect options={ESTADO_OPTS} value={estado} onChange={setEstado} />
      </SheetSection>
      <SheetSection title={country === 'BR' ? 'Estado' : 'Distrito'}>
        <ChipSelect options={distritoOpts} value={distrito} onChange={setDistrito} />
      </SheetSection>
      {country === 'BR' && bairroOpts.length > 0 && (
        <SheetSection title="Bairro">
          <ChipSelect
            options={[{ value: '', label: 'Todos' }, ...bairroOpts.map((b) => ({ value: b, label: b }))]}
            value={bairro}
            onChange={setBairro}
          />
        </SheetSection>
      )}
    </BottomSheet>
  );
}
