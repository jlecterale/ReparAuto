// Merges audio-extracted fields (plan 24) into the web listing forms.
// Policy: free-text/numeric inputs are only filled when still empty — the
// user's typing always wins; select fields whose blank state is a default
// (combustível, caixa, condição, …) are overwritten, since an explicit spoken
// value beats an untouched default. Pure and unit-tested.

import type { CarroFormData } from '@/types/carro';
import type { CompatibilityEntry } from '@/types/peca';
import type { CarAudioFields, PartAudioFields } from '@/lib/audioListing';

const asString = (value: number | string | undefined): string | undefined =>
  value === undefined ? undefined : String(value);

/** Fills `target[key]` with `value` only when the current value is empty. */
function fillIfEmpty<T extends Record<K, string>, K extends keyof T>(target: T, key: K, value?: string) {
  if (value !== undefined && !target[key].trim()) target[key] = value as T[K];
}

export function applyCarAudioFieldsToForm(dados: CarroFormData, fields: CarAudioFields): CarroFormData {
  const next: CarroFormData = { ...dados, features: [...dados.features] };

  fillIfEmpty(next, 'marca', fields.marca);
  fillIfEmpty(next, 'modelo', fields.modelo);
  fillIfEmpty(next, 'anoFabricacao', asString(fields.anoFabricacao));
  // Sellers rarely distinguish the model year; mirror it so the required field
  // starts sensible — it stays editable on review.
  fillIfEmpty(next, 'anoModelo', asString(fields.anoFabricacao));
  fillIfEmpty(next, 'km', asString(fields.km));
  fillIfEmpty(next, 'preco', asString(fields.preco));
  fillIfEmpty(next, 'cor', fields.cor);
  fillIfEmpty(next, 'portas', asString(fields.portas));
  fillIfEmpty(next, 'seats', asString(fields.seats));
  fillIfEmpty(next, 'power', asString(fields.power));
  fillIfEmpty(next, 'displacement', asString(fields.displacement));
  fillIfEmpty(next, 'bodyType', fields.bodyType);
  fillIfEmpty(next, 'traction', fields.traction);
  fillIfEmpty(next, 'descricao', fields.descricao);

  if (fields.combustivel) next.combustivel = fields.combustivel;
  if (fields.cambio) next.cambio = fields.cambio;
  if (fields.condition) next.condition = fields.condition;
  if (fields.estadoVeiculo) next.estadoVeiculo = fields.estadoVeiculo;

  // Only a locality resolved to a real concelho (distrito present) can feed the
  // location picker — it validates against the concelho list.
  if (fields.local && fields.distrito && !next.localizacao) {
    next.localizacao = fields.local;
    next.localizacaoDistrito = fields.distrito;
  }

  if (fields.features?.length) {
    for (const feature of fields.features) {
      if (!next.features.includes(feature)) next.features.push(feature);
    }
  }

  return next;
}

/** Minimal structural view of PecaForm's local state that this merge touches. */
export interface PartAudioFormShape {
  tipo: string;
  titulo: string;
  categoria: string;
  estado: string;
  preco: string;
  numeroOEM: string;
  descricao: string;
  localizacao: string;
  localizacaoDistrito: string;
}

export function applyPartAudioFieldsToForm<T extends PartAudioFormShape>(form: T, fields: PartAudioFields): T {
  const next = { ...form };

  fillIfEmpty(next, 'titulo', fields.titulo);
  fillIfEmpty(next, 'preco', asString(fields.preco));
  fillIfEmpty(next, 'numeroOEM', fields.numeroOEM);
  fillIfEmpty(next, 'descricao', fields.descricao);

  if (fields.tipo) next.tipo = fields.tipo;
  if (fields.categoria) next.categoria = fields.categoria;
  if (fields.estado) next.estado = fields.estado;

  if (fields.local && fields.distrito && !next.localizacao) {
    next.localizacao = fields.local;
    next.localizacaoDistrito = fields.distrito;
  }

  return next;
}

/** Compatibility entry seeded from the spoken car brand/model (parts require one). */
export function partCompatibilityFromAudio(fields: PartAudioFields): CompatibilityEntry | null {
  if (!fields.marcaCarro) return null;
  return fields.modeloCarro
    ? { marca: fields.marcaCarro, modelo: fields.modeloCarro }
    : { marca: fields.marcaCarro };
}
