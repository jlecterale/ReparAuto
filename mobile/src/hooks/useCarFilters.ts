import { useMemo, useState } from 'react';
import { getCoordenadas, getDistritoForConcelho, haversineKm } from '@/lib/geo';
import type { Carro, Combustivel, EstadoVeiculo } from '@/types';

export type QuickChip = 'todos' | 'ate1000' | 'ate5000' | 'reparar';
export type Ordenar = 'relevancia' | 'preco_asc' | 'preco_desc';

export interface CarAdvFilters {
  marca: string;
  modelo: string;
  precoMin: string;
  precoMax: string;
  kmMin: string;
  kmMax: string;
  anoMin: string;
  anoMax: string;
  combustiveis: Combustivel[];
  estado: '' | EstadoVeiculo;
  /** false → filter by distrito/concelho; true → filter by radius. */
  raioMode: boolean;
  distrito: string;
  concelho: string;
  raioDist: string;
  raioCentro: string;
  raioKm: string;
}

const INITIAL: CarAdvFilters = {
  marca: '',
  modelo: '',
  precoMin: '',
  precoMax: '',
  kmMin: '',
  kmMax: '',
  anoMin: '',
  anoMax: '',
  combustiveis: [],
  estado: '',
  raioMode: false,
  distrito: '',
  concelho: '',
  raioDist: '',
  raioCentro: '',
  raioKm: '',
};

function num(v: string): number | null {
  const n = Number(v);
  return v.trim() && !Number.isNaN(n) ? n : null;
}

function aplicaChip(carro: Carro, chip: QuickChip): boolean {
  switch (chip) {
    case 'ate1000':
      return carro.preco <= 1000;
    case 'ate5000':
      return carro.preco <= 5000;
    case 'reparar':
      return carro.estadoVeiculo === 'manutencao';
    default:
      return true;
  }
}

export function useCarFilters(carros: Carro[]) {
  const [busca, setBusca] = useState('');
  const [chip, setChip] = useState<QuickChip>('todos');
  const [ordenar, setOrdenar] = useState<Ordenar>('relevancia');
  const [f, setF] = useState<CarAdvFilters>(INITIAL);

  const update = (partial: Partial<CarAdvFilters>) => setF((prev) => ({ ...prev, ...partial }));
  const limpar = () => setF(INITIAL);

  // Marca/modelo options are derived from the loaded listings so only brands and
  // models that actually have ads are offered. Modelos depend on the picked marca.
  const marcaOpts = useMemo(() => {
    const set = new Set<string>();
    for (const c of carros) if (c.marca) set.add(c.marca);
    return [...set].sort((a, b) => a.localeCompare(b, 'pt'));
  }, [carros]);

  const modeloOpts = useMemo(() => {
    if (!f.marca) return [];
    const set = new Set<string>();
    for (const c of carros) if (c.marca === f.marca && c.modelo) set.add(c.modelo);
    return [...set].sort((a, b) => a.localeCompare(b, 'pt'));
  }, [carros, f.marca]);

  const filtersCount = useMemo(() => {
    const localizacaoActive = f.raioMode ? !!(f.raioCentro && f.raioKm) : !!(f.concelho || f.distrito);
    return [
      f.marca || f.modelo,
      f.precoMin || f.precoMax,
      f.kmMin || f.kmMax,
      f.anoMin || f.anoMax,
      f.combustiveis.length > 0,
      f.estado,
      localizacaoActive,
    ].filter(Boolean).length;
  }, [f]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const precoMin = num(f.precoMin);
    const precoMax = num(f.precoMax);
    const kmMin = num(f.kmMin);
    const kmMax = num(f.kmMax);
    const anoMin = num(f.anoMin);
    const anoMax = num(f.anoMax);
    const raioKm = num(f.raioKm);
    const centro = f.raioMode && f.raioCentro ? getCoordenadas(f.raioCentro) : null;

    let cs = carros.filter((c) => {
      if (!aplicaChip(c, chip)) return false;
      if (termo && !`${c.marca} ${c.modelo} ${c.local}`.toLowerCase().includes(termo)) return false;
      if (f.marca && c.marca !== f.marca) return false;
      if (f.modelo && c.modelo !== f.modelo) return false;
      if (precoMin !== null && c.preco < precoMin) return false;
      if (precoMax !== null && c.preco > precoMax) return false;
      if (kmMin !== null && c.km < kmMin) return false;
      if (kmMax !== null && c.km > kmMax) return false;
      if (anoMin !== null && c.anoFabricacao < anoMin) return false;
      if (anoMax !== null && c.anoFabricacao > anoMax) return false;
      if (f.combustiveis.length > 0 && !f.combustiveis.includes(c.combustivel)) return false;
      if (f.estado && c.estadoVeiculo !== f.estado) return false;

      // Location: radius takes precedence, then concelho, then distrito.
      if (centro && raioKm && raioKm > 0) {
        const coords = c.coordenadas ?? getCoordenadas(c.local);
        if (!coords) return false;
        if (haversineKm(centro, coords) > raioKm) return false;
      } else if (f.concelho) {
        if ((c.local ?? '').toLowerCase() !== f.concelho.toLowerCase()) return false;
      } else if (f.distrito) {
        const cd = c.distrito ?? getDistritoForConcelho(c.local) ?? '';
        if (cd !== f.distrito) return false;
      }
      return true;
    });

    if (ordenar === 'preco_asc') cs = [...cs].sort((a, b) => a.preco - b.preco);
    else if (ordenar === 'preco_desc') cs = [...cs].sort((a, b) => b.preco - a.preco);
    return cs;
  }, [carros, busca, chip, ordenar, f]);

  return {
    busca,
    setBusca,
    chip,
    setChip,
    ordenar,
    setOrdenar,
    filters: f,
    update,
    limpar,
    filtersCount,
    filtrados,
    marcaOpts,
    modeloOpts,
  };
}
