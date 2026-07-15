import 'server-only';
import { cache } from 'react';
import { getAdminDb, ADMIN_PROJECT_ID } from './firebase.admin';
import type { Carro } from '@/types/carro';
import type { Peca } from '@/types/peca';
import type { OficinaMecanico } from '@/types/oficina';
import type { IntencaoCompra } from '@/types/intencao';

const REST_BASE = `https://firestore.googleapis.com/v1/projects/${ADMIN_PROJECT_ID}/databases/(default)/documents`;

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDoc = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
};

function decodeValue(v: FirestoreValue): unknown {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v && v.timestampValue) {
    const date = new Date(v.timestampValue);
    return {
      toDate: () => date,
      toMillis: () => date.getTime(),
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    };
  }
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(decodeValue);
  if ('mapValue' in v) {
    const out: Record<string, unknown> = {};
    for (const [k, vv] of Object.entries(v.mapValue?.fields || {})) out[k] = decodeValue(vv);
    return out;
  }
  return null;
}

function decodeDoc<T>(doc: FirestoreDoc): T {
  const id = doc.name.split('/').pop()!;
  const out: Record<string, unknown> = { id };
  for (const [k, v] of Object.entries(doc.fields || {})) out[k] = decodeValue(v);
  return out as T;
}

// Server-side status filter via :runQuery, so the fallback never downloads
// pending/rejected listings just to discard them. POST requests skip Next's
// fetch cache, but every caller sits behind ISR (60s+) which already
// throttles regeneration.
async function restListByStatus(collection: string, status: string): Promise<FirestoreDoc[]> {
  const res = await fetch(`${REST_BASE}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'status' },
            op: 'EQUAL',
            value: { stringValue: status },
          },
        },
      },
    }),
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as { document?: FirestoreDoc }[];
  return rows.map((r) => r.document).filter((d): d is FirestoreDoc => Boolean(d));
}

async function restGet(collection: string, id: string): Promise<FirestoreDoc | null> {
  const res = await fetch(`${REST_BASE}/${collection}/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return (await res.json()) as FirestoreDoc;
}

async function adminList<T>(collection: string, status?: string): Promise<T[] | null> {
  const db = getAdminDb();
  if (!db) return null;
  try {
    const ref = db.collection(collection);
    const snap = await (status ? ref.where('status', '==', status) : ref).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  } catch {
    return null;
  }
}

async function adminGet<T>(collection: string, id: string): Promise<T | null> {
  const db = getAdminDb();
  if (!db) return null;
  try {
    const snap = await db.collection(collection).doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as T;
  } catch {
    return null;
  }
}

export async function getCarrosServer(): Promise<Carro[]> {
  const adminResult = await adminList<Carro>('cars', 'aprovado');
  const all = adminResult ?? (await restListByStatus('cars', 'aprovado')).map((d) => decodeDoc<Carro>(d));
  return all.filter((c) => c.status === 'aprovado');
}

// React.cache dedupes the generateMetadata + page-component fetch pair
// within a single render.
export const getCarroPorIdServer = cache(async (id: string): Promise<Carro | null> => {
  const adminResult = await adminGet<Carro>('cars', id);
  if (adminResult) return adminResult;
  const doc = await restGet('cars', id);
  return doc ? decodeDoc<Carro>(doc) : null;
});

export async function getPecasServer(): Promise<Peca[]> {
  const adminResult = await adminList<Peca>('parts', 'aprovado');
  const all = adminResult ?? (await restListByStatus('parts', 'aprovado')).map((d) => decodeDoc<Peca>(d));
  return all.filter((p) => p.status === 'aprovado');
}

export const getPecaPorIdServer = cache(async (id: string): Promise<Peca | null> => {
  const adminResult = await adminGet<Peca>('parts', id);
  if (adminResult) return adminResult;
  const doc = await restGet('parts', id);
  return doc ? decodeDoc<Peca>(doc) : null;
});

// Workshops/mechanics live in the `services` collection (public-read).
export const getOficinaPorIdServer = cache(async (id: string): Promise<OficinaMecanico | null> => {
  const adminResult = await adminGet<OficinaMecanico>('services', id);
  if (adminResult) return adminResult;
  const doc = await restGet('services', id);
  return doc ? decodeDoc<OficinaMecanico>(doc) : null;
});

const INTENCOES_COLLECTION = 'intencoes_compra';

export const getIntencaoPorIdServer = cache(async (id: string): Promise<IntencaoCompra | null> => {
  const adminResult = await adminGet<IntencaoCompra>(INTENCOES_COLLECTION, id);
  if (adminResult) return adminResult;
  const doc = await restGet(INTENCOES_COLLECTION, id);
  return doc ? decodeDoc<IntencaoCompra>(doc) : null;
});
