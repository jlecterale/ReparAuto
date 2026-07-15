'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { saveAdDraft, loadAdDraft, clearAdDraft, type AdDraft, type AdDraftKind } from '@/lib/adDraft';

interface UseAdDraftOptions<T> {
  kind: AdDraftKind;
  /** Gate for the whole lifecycle (e.g. the wizard branch being active). */
  enabled?: boolean;
  /** Pauses autosave/prompt without disabling (e.g. while publishing). */
  suspended?: boolean;
  /**
   * Snapshot to autosave (debounced). Pass null when another component owns
   * the form state and autosaves it itself (prompt-only instance).
   */
  data: T | null;
  /** Whether the form holds real progress (prefilled fields excluded). */
  hasContent: boolean;
  /** Restore the saved draft without asking (deep link ?retomar=1). */
  resumeImmediately?: boolean;
  /** Called with the draft on resume. Omit for an autosave-only instance. */
  onRestore?: (draft: AdDraft<T>) => void;
  /** Extra cleanup when a draft is discarded (e.g. release photo Files). */
  onDiscard?: (draft: AdDraft<T>) => void;
}

/**
 * Draft lifecycle for a listing form: offers to resume a saved draft once
 * auth has resolved, autosaves progress (debounced), and exposes the pending
 * prompt with resume/discard handlers for <DraftResumePrompt>.
 *
 * Guards:
 * - Nothing runs while auth is still restoring — otherwise an early autosave
 *   would stamp uid:null and silently de-own a logged-in user's draft.
 * - A draft saved after this mount is this visit's own autosave: never
 *   prompted (marked handled), since its content is already on screen.
 * - resumeImmediately only auto-applies over a pristine form; with typed
 *   content it falls back to the prompt so the user decides.
 * - Autosave skips while the data still equals the baseline captured at
 *   mount (or the last resetBaseline()), so a partially reset form doesn't
 *   resurrect a ghost draft of an already-published listing.
 */
export function useAdDraft<T>({
  kind,
  enabled = true,
  suspended = false,
  data,
  hasContent,
  resumeImmediately = false,
  onRestore,
  onDiscard,
}: UseAdDraftOptions<T>) {
  const { auth } = useApp();
  const uid = auth.user?.uid ?? null;
  const authLoading = auth.loading;

  const [prompt, setPrompt] = useState<AdDraft<T> | null>(null);
  const handledRef = useRef(false);
  const mountTimeRef = useRef(Date.now());
  const baselineRef = useRef<string | null>(null);
  const hasContentRef = useRef(hasContent);
  hasContentRef.current = hasContent;
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // Offer to resume a saved draft. Runs once auth resolves (an owned draft
  // is invisible before the uid is known).
  useEffect(() => {
    if (!enabled || suspended || authLoading || handledRef.current || !onRestoreRef.current) return;
    const draft = loadAdDraft<T>(kind, uid);
    if (!draft) return;
    handledRef.current = true;
    // This visit's own autosave — its content is already (or about to be) on
    // screen; re-prompting would offer the user their own live form.
    if (draft.savedAt >= mountTimeRef.current) return;
    if (resumeImmediately && !hasContentRef.current) {
      onRestoreRef.current(draft);
    } else {
      setPrompt(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, suspended, authLoading, uid, kind]);

  // Autosave (debounced) whenever the form holds real, changed progress.
  useEffect(() => {
    if (data === null) return;
    const serialized = JSON.stringify(data);
    // First sight of the data is the pristine baseline — captured before any
    // guard so a later activation doesn't mistake typed content for it.
    if (baselineRef.current === null) {
      baselineRef.current = serialized;
      return;
    }
    if (!enabled || suspended || authLoading || prompt || !hasContent) return;
    if (serialized === baselineRef.current) return;
    const timer = setTimeout(() => {
      saveAdDraft<T>(kind, data, { uid });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled, suspended, authLoading, prompt, hasContent, uid, kind]);

  return {
    prompt,
    resume: () => {
      if (prompt) onRestoreRef.current?.(prompt);
      setPrompt(null);
    },
    discard: () => {
      if (prompt) onDiscard?.(prompt);
      clearAdDraft(kind);
      setPrompt(null);
    },
    /** Re-anchor the no-change baseline (call after a partial form reset). */
    resetBaseline: (next: T) => {
      baselineRef.current = JSON.stringify(next);
    },
  };
}
