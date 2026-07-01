import type { CompatibilityEntry, Peca } from '@/types/peca';
import type { Carro } from '@/types/carro';

const normalize = (s: string | undefined | null): string =>
  (s ?? '').toString().trim().toLowerCase();

const motorTokens = (motor: string | undefined): string[] => {
  const n = normalize(motor);
  if (!n) return [];
  return n
    .replace(/[^a-z0-9.\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
};

export function motorMatches(entryMotor: string | undefined, candidateMotor: string | undefined): boolean {
  if (!entryMotor) return true;
  const a = motorTokens(entryMotor);
  const b = motorTokens(candidateMotor);
  if (a.length === 0) return true;
  if (b.length === 0) return false;
  return a.every((tok) => b.some((t) => t === tok || t.startsWith(tok) || tok.startsWith(t)));
}

export function entryMatchesCar(entry: CompatibilityEntry, carro: Carro): boolean {
  if (normalize(entry.marca) !== normalize(carro.marca)) return false;
  if (entry.modelo) {
    const em = normalize(entry.modelo);
    const cm = normalize(carro.modelo);
    if (em && cm && !cm.includes(em) && !em.includes(cm)) return false;
  }
  const ano = carro.anoFabricacao;
  if (entry.anoInicio && ano && ano < entry.anoInicio) return false;
  if (entry.anoFim && ano && ano > entry.anoFim) return false;
  return true;
}

export function pecaCompatibleWithCar(peca: Peca, carro: Carro): boolean {
  if (peca.compatibilidades && peca.compatibilidades.length > 0) {
    return peca.compatibilidades.some((e) => entryMatchesCar(e, carro));
  }
  const pecaMarca = normalize(peca.marcaCarro);
  if (!pecaMarca) return false;
  if (pecaMarca !== normalize(carro.marca)) return false;
  if (peca.modeloCarro) {
    const pm = normalize(peca.modeloCarro);
    const cm = normalize(carro.modelo);
    if (pm && cm && !cm.includes(pm) && !pm.includes(cm)) return false;
  }
  return true;
}

export function carMatchesPeca(carro: Carro, peca: Peca): boolean {
  return pecaCompatibleWithCar(peca, carro);
}

export function entriesShareScope(a: CompatibilityEntry, b: CompatibilityEntry): boolean {
  if (normalize(a.marca) !== normalize(b.marca)) return false;
  if (a.modelo && b.modelo) {
    const am = normalize(a.modelo);
    const bm = normalize(b.modelo);
    if (am && bm && !am.includes(bm) && !bm.includes(am)) return false;
  }
  if (a.motor && b.motor && !motorMatches(a.motor, b.motor) && !motorMatches(b.motor, a.motor)) {
    return false;
  }
  const aInicio = a.anoInicio ?? 1900;
  const aFim = a.anoFim ?? 2100;
  const bInicio = b.anoInicio ?? 1900;
  const bFim = b.anoFim ?? 2100;
  if (aFim < bInicio || bFim < aInicio) return false;
  return true;
}

export function pecasShareCompatibility(a: Peca, b: Peca): boolean {
  if (a.categoria && b.categoria && a.categoria !== b.categoria) return false;
  const aCompats = a.compatibilidades || [];
  const bCompats = b.compatibilidades || [];
  if (aCompats.length > 0 && bCompats.length > 0) {
    return aCompats.some((ac) => bCompats.some((bc) => entriesShareScope(ac, bc)));
  }
  if (a.marcaCarro && b.marcaCarro) {
    return normalize(a.marcaCarro) === normalize(b.marcaCarro);
  }
  return false;
}

export function formatCompatibilityEntry(entry: CompatibilityEntry): string {
  const parts: string[] = [entry.marca];
  if (entry.modelo) parts.push(entry.modelo);
  if (entry.anoInicio || entry.anoFim) {
    const ini = entry.anoInicio ?? '';
    const fim = entry.anoFim ?? '';
    if (ini && fim) parts.push(`${ini}-${fim}`);
    else if (ini) parts.push(`≥ ${ini}`);
    else if (fim) parts.push(`≤ ${fim}`);
  }
  if (entry.motor) parts.push(entry.motor);
  return parts.join(' · ');
}

export function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
