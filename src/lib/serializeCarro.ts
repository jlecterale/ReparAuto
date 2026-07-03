import type { Timestamp } from 'firebase/firestore';
import type { Carro } from '@/types/carro';

// Server components fetch listings with Admin SDK `Timestamp` instances (or the
// REST-fallback lookalikes from db.server.ts). Those can't cross the RSC
// server→client prop boundary — only JSON-safe values can — so timestamps are
// flattened to epoch milliseconds and rebuilt on the client with the same
// duck-typed shape ({toDate, toMillis, seconds, nanoseconds}) the rest of the
// client code already consumes.

export interface SerializedCarro extends Omit<Carro, 'dataCriacao' | 'dataAprovacao' | 'impulso'> {
  dataCriacao: number | null;
  dataAprovacao?: number | null;
  impulso?: { ativo: boolean; dataInicio?: number | null; dataFim?: number | null };
}

type TimestampLike = { toMillis?: () => number };

function toMillisOrNull(value: unknown): number | null {
  const ts = value as TimestampLike | null | undefined;
  return typeof ts?.toMillis === 'function' ? ts.toMillis() : null;
}

function fromMillis(ms: number): Timestamp {
  return {
    toDate: () => new Date(ms),
    toMillis: () => ms,
    seconds: Math.floor(ms / 1000),
    nanoseconds: (ms % 1000) * 1_000_000,
  } as unknown as Timestamp;
}

export function serializeCarro(carro: Carro): SerializedCarro {
  const { dataCriacao, dataAprovacao, impulso, ...rest } = carro;
  return {
    ...rest,
    dataCriacao: toMillisOrNull(dataCriacao),
    ...(dataAprovacao !== undefined ? { dataAprovacao: toMillisOrNull(dataAprovacao) } : {}),
    ...(impulso
      ? {
          impulso: {
            ativo: impulso.ativo,
            ...(impulso.dataInicio !== undefined ? { dataInicio: toMillisOrNull(impulso.dataInicio) } : {}),
            ...(impulso.dataFim !== undefined ? { dataFim: toMillisOrNull(impulso.dataFim) } : {}),
          },
        }
      : {}),
  };
}

export function deserializeCarro(serialized: SerializedCarro): Carro {
  const { dataCriacao, dataAprovacao, impulso, ...rest } = serialized;
  return {
    ...rest,
    dataCriacao: fromMillis(dataCriacao ?? 0),
    ...(dataAprovacao != null ? { dataAprovacao: fromMillis(dataAprovacao) } : {}),
    ...(impulso
      ? {
          impulso: {
            ativo: impulso.ativo,
            ...(impulso.dataInicio != null ? { dataInicio: fromMillis(impulso.dataInicio) } : {}),
            ...(impulso.dataFim != null ? { dataFim: fromMillis(impulso.dataFim) } : {}),
          },
        }
      : {}),
  };
}
