/**
 * Client-side persistence for in-progress listing forms ("rascunhos").
 *
 * A visitor who abandons the anunciar wizard mid-way keeps their typed data in
 * localStorage (one draft per listing kind) and is offered to resume it the
 * next time they start an ad. Photos are NOT persisted — they live as blob
 * URLs backed by in-memory File objects and would blow the storage quota.
 *
 * Drafts are stamped with the author's uid so a shared browser never leaks a
 * draft across accounts: an owned draft is only visible to the same uid, an
 * anonymous draft is visible to anyone on this browser.
 *
 * Every access is wrapped in try/catch — localStorage can be disabled, full,
 * or blocked by cookie settings (matching onboarding.ts / useFavoritos).
 */

import type { CarroFormData } from '@/types/carro';

export type AdDraftKind = 'carro' | 'peca';

export interface AdDraft<T = unknown> {
  uid: string | null;
  data: T;
  /** Wizard step to resume at (car flow only). */
  step?: number;
  savedAt: number;
}

const keyFor = (kind: AdDraftKind) => `reparauto_ad_draft_${kind}`;

export function saveAdDraft<T>(
  kind: AdDraftKind,
  data: T,
  opts: { uid: string | null; step?: number },
): void {
  try {
    const draft: AdDraft<T> = {
      uid: opts.uid,
      data,
      step: opts.step,
      savedAt: Date.now(),
    };
    localStorage.setItem(keyFor(kind), JSON.stringify(draft));
  } catch {
    /* ignore — storage unavailable */
  }
}

export function loadAdDraft<T>(kind: AdDraftKind, uid: string | null): AdDraft<T> | null {
  try {
    const raw = localStorage.getItem(keyFor(kind));
    if (!raw) return null;
    const draft = JSON.parse(raw) as AdDraft<T>;
    if (!draft || typeof draft !== 'object' || !draft.data || typeof draft.data !== 'object') {
      return null;
    }
    // An owned draft never surfaces for another account (or for a logged-out
    // visitor); it reappears when its author signs back in.
    if (draft.uid && draft.uid !== uid) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearAdDraft(kind: AdDraftKind): void {
  try {
    localStorage.removeItem(keyFor(kind));
  } catch {
    /* ignore — storage unavailable */
  }
}

/**
 * Whether the car wizard holds anything worth drafting. Contact fields are
 * prefilled from the profile, so they never count as user progress.
 */
export function hasCarDraftContent(dados: CarroFormData): boolean {
  return !!(dados.marca || dados.modelo || dados.km || dados.preco || dados.descricao);
}

/** Same idea for the part form (prefilled contacts excluded). */
export function hasPartDraftContent(
  form: { titulo: string; preco: string; descricao: string; numeroOEM: string },
  compatibilidades: unknown[],
): boolean {
  return !!(form.titulo || form.preco || form.descricao || form.numeroOEM || compatibilidades.length);
}
