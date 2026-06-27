import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetSection } from '@/components/ui/SheetSection';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { MultiChipSelect } from '@/components/ui/MultiChipSelect';
import { COMBUSTIVEIS, DISTRITOS } from '@/lib/constants';
import { getConcelhos } from '@/lib/geo';
import type { CarAdvFilters } from '@/hooks/useCarFilters';
import type { Combustivel } from '@/types';
import { colors } from '@/theme/colors';

const TODOS = { value: '', label: 'Todos' };
const DISTRITO_OPTS = [TODOS, ...DISTRITOS.map((d) => ({ value: d, label: d }))];
const ESTADO_OPTS = [
  TODOS,
  { value: 'pronto', label: 'Pronto a andar' },
  { value: 'manutencao', label: 'Para reparar' },
];
const COMBUSTIVEL_OPTS = COMBUSTIVEIS.map((c) => ({ value: c, label: c }));
const RAIO_OPTS = [
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: '200', label: '200 km' },
];

interface CarFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: CarAdvFilters;
  update: (partial: Partial<CarAdvFilters>) => void;
  onClear: () => void;
  resultCount: number;
  marcaOpts: string[];
  modeloOpts: string[];
}

export function CarFiltersSheet({
  visible,
  onClose,
  filters: f,
  update,
  onClear,
  resultCount,
  marcaOpts,
  modeloOpts,
}: CarFiltersSheetProps) {
  const marcaSelectOpts = [TODOS, ...marcaOpts.map((m) => ({ value: m, label: m }))];
  const modeloSelectOpts = [TODOS, ...modeloOpts.map((m) => ({ value: m, label: m }))];
  const concelhoOpts = [TODOS, ...getConcelhos(f.distrito).map((c) => ({ value: c.nome, label: c.nome }))];
  const centroOpts = getConcelhos(f.raioDist).map((c) => ({ value: c.nome, label: c.nome }));

  function toggleCombustivel(value: Combustivel) {
    update({
      combustiveis: f.combustiveis.includes(value)
        ? f.combustiveis.filter((x) => x !== value)
        : [...f.combustiveis, value],
    });
  }

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
      {marcaOpts.length > 0 && (
        <SheetSection title="Marca" first>
          <ChipSelect
            options={marcaSelectOpts}
            value={f.marca}
            onChange={(v) => update({ marca: v, modelo: '' })}
          />
        </SheetSection>
      )}

      {!!f.marca && modeloOpts.length > 0 && (
        <SheetSection title="Modelo">
          <ChipSelect options={modeloSelectOpts} value={f.modelo} onChange={(v) => update({ modelo: v })} />
        </SheetSection>
      )}

      <SheetSection title="Preço (€)" first={marcaOpts.length === 0}>
        <RangeRow
          minValue={f.precoMin}
          maxValue={f.precoMax}
          onMin={(v) => update({ precoMin: v })}
          onMax={(v) => update({ precoMax: v })}
        />
      </SheetSection>

      <SheetSection title="Quilómetros">
        <RangeRow
          minValue={f.kmMin}
          maxValue={f.kmMax}
          onMin={(v) => update({ kmMin: v })}
          onMax={(v) => update({ kmMax: v })}
        />
      </SheetSection>

      <SheetSection title="Ano">
        <RangeRow
          minValue={f.anoMin}
          maxValue={f.anoMax}
          onMin={(v) => update({ anoMin: v })}
          onMax={(v) => update({ anoMax: v })}
          maxLength={4}
        />
      </SheetSection>

      <SheetSection title="Combustível">
        <MultiChipSelect options={COMBUSTIVEL_OPTS} values={f.combustiveis} onToggle={toggleCombustivel} />
      </SheetSection>

      <SheetSection title="Estado">
        <ChipSelect options={ESTADO_OPTS} value={f.estado} onChange={(v) => update({ estado: v as CarAdvFilters['estado'] })} />
      </SheetSection>

      <SheetSection title="Localização">
        {/* Mode toggle */}
        <View className="mb-3 flex-row self-start rounded-full bg-neutral-100 p-1">
          <ModeTab
            label="Distrito"
            active={!f.raioMode}
            onPress={() => update({ raioMode: false, raioDist: '', raioCentro: '', raioKm: '' })}
          />
          <ModeTab
            label="Raio"
            active={f.raioMode}
            onPress={() => update({ raioMode: true, distrito: '', concelho: '' })}
          />
        </View>

        {!f.raioMode ? (
          <View className="gap-3">
            <Sub label="Distrito">
              <ChipSelect
                options={DISTRITO_OPTS}
                value={f.distrito}
                onChange={(v) => update({ distrito: v, concelho: '' })}
              />
            </Sub>
            {!!f.distrito && (
              <Sub label="Concelho">
                <ChipSelect options={concelhoOpts} value={f.concelho} onChange={(v) => update({ concelho: v })} />
              </Sub>
            )}
          </View>
        ) : (
          <View className="gap-3">
            <Sub label="1. Distrito do centro">
              <ChipSelect
                options={DISTRITO_OPTS}
                value={f.raioDist}
                onChange={(v) => update({ raioDist: v, raioCentro: '' })}
              />
            </Sub>
            {!!f.raioDist && (
              <Sub label="2. Centro">
                <ChipSelect
                  options={centroOpts}
                  value={f.raioCentro}
                  onChange={(v) => update({ raioCentro: v })}
                />
              </Sub>
            )}
            {!!f.raioCentro && (
              <Sub label={`3. Raio à volta de ${f.raioCentro}`}>
                <ChipSelect options={RAIO_OPTS} value={f.raioKm} onChange={(v) => update({ raioKm: v })} />
                <View className="mt-2 w-32">
                  <Input
                    value={f.raioKm}
                    onChangeText={(v) => update({ raioKm: v })}
                    placeholder="Outro (km)"
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
              </Sub>
            )}
          </View>
        )}
      </SheetSection>
    </BottomSheet>
  );
}

function Sub({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-1.5 text-sm font-semibold text-fg-muted">{label}</Text>
      {children}
    </View>
  );
}

function RangeRow({
  minValue,
  maxValue,
  onMin,
  onMax,
  maxLength,
}: {
  minValue: string;
  maxValue: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1">
        <Input value={minValue} onChangeText={onMin} placeholder="Mínimo" keyboardType="number-pad" maxLength={maxLength} />
      </View>
      <Text className="text-fg-subtle">–</Text>
      <View className="flex-1">
        <Input value={maxValue} onChangeText={onMax} placeholder="Máximo" keyboardType="number-pad" maxLength={maxLength} />
      </View>
    </View>
  );
}

function ModeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`rounded-full px-4 py-1.5 ${active ? 'bg-white' : ''}`}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-primary-700' : 'text-fg-subtle'}`} style={!active ? { color: colors.fg.subtle } : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}
