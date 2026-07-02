import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { clearAdDraft, loadAdDraft, saveAdDraft, type AdDraftKind } from '@/lib/draft';

interface UseAdDraftOptions<T> {
  kind: AdDraftKind;
  /** Drafts only apply to new listings — pass false in edit mode. */
  enabled: boolean;
  /** Memoized snapshot of the form's current state. */
  data: T;
  /** Whether the form holds real progress (prefilled fields excluded). */
  hasContent: boolean;
  /** True while the publish request is in flight. */
  submitting: boolean;
  /** True once the listing was submitted, so the leave guard steps aside. */
  submitted: boolean;
  /** Restore the saved draft without asking (deep link ?retomar=1). */
  resumeImmediately: boolean;
  /** Noun phrase for the resume prompt, e.g. "um anúncio de carro". */
  itemLabel: string;
  onRestore: (data: T) => void;
}

/**
 * Draft lifecycle for a listing form: offers to resume a saved draft on
 * mount, autosaves progress (so it survives even an app kill), and guards
 * leaving the screen with a keep-editing / save-draft / discard dialog.
 *
 * Guards:
 * - Nothing runs while auth is still restoring — otherwise an early autosave
 *   would stamp uid:null and silently de-own a signed-in user's draft.
 * - A draft saved after this mount is this visit's own autosave: never
 *   prompted, its content is already on screen.
 * - resumeImmediately only auto-applies over a pristine form; with typed
 *   content it falls back to the prompt so the user decides.
 * - A REPLACE removal (e.g. the publish button redirecting to /login) is
 *   never blocked: the draft is saved silently and the redirect proceeds.
 */
export function useAdDraft<T>({
  kind,
  enabled,
  data,
  hasContent,
  submitting,
  submitted,
  resumeImmediately,
  itemLabel,
  onRestore,
}: UseAdDraftOptions<T>) {
  const { user, loading: authLoading } = useAuth();
  const navigation = useNavigation();
  const promptedRef = useRef(false);
  const mountTimeRef = useRef(Date.now());
  const hasContentRef = useRef(hasContent);
  hasContentRef.current = hasContent;
  // Keep the latest restore callback without re-running the prompt effect.
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // Offer to resume a saved draft once auth resolves (an owned draft is
  // invisible before the uid is known).
  useEffect(() => {
    if (!enabled || authLoading || promptedRef.current) return;
    let cancelled = false;
    loadAdDraft<T>(kind, user?.uid ?? null).then((draft) => {
      if (cancelled || !draft || promptedRef.current) return;
      promptedRef.current = true;
      // This visit's own autosave — its content is already on screen.
      if (draft.savedAt >= mountTimeRef.current) return;
      if (resumeImmediately && !hasContentRef.current) {
        onRestoreRef.current(draft.data);
        return;
      }
      Alert.alert(
        'Continuar rascunho?',
        `Tem ${itemLabel} por terminar. O rascunho fica guardado apenas neste dispositivo. Quer continuar onde parou?`,
        [
          { text: 'Descartar', style: 'destructive', onPress: () => void clearAdDraft(kind) },
          { text: 'Continuar', onPress: () => onRestoreRef.current(draft.data) },
        ],
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, authLoading, user?.uid]);

  // Autosave the draft (debounced) so progress survives even an app kill.
  useEffect(() => {
    if (!enabled || authLoading || submitting || submitted || !hasContent) return;
    const timer = setTimeout(() => {
      saveAdDraft(kind, data, user?.uid ?? null);
    }, 800);
    return () => clearTimeout(timer);
  }, [data, enabled, authLoading, submitting, submitted, hasContent, kind, user?.uid]);

  // Leaving with unpublished work: ask to keep the draft, discard, or stay.
  usePreventRemove(enabled && hasContent && !submitting && !submitted, ({ data: event }) => {
    const leave = () => navigation.dispatch(event.action);
    // Programmatic redirects (REPLACE, e.g. to /login) must go through —
    // keep the work as a draft and let them proceed.
    if (event.action.type === 'REPLACE') {
      saveAdDraft(kind, data, user?.uid ?? null);
      leave();
      return;
    }
    Alert.alert('Sair sem publicar?', 'Pode guardar um rascunho neste dispositivo e continuar mais tarde.', [
      { text: 'Continuar a editar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          // Navigate first; the storage cleanup can finish in the background.
          clearAdDraft(kind);
          leave();
        },
      },
      {
        text: 'Guardar rascunho',
        onPress: () => {
          saveAdDraft(kind, data, user?.uid ?? null);
          leave();
        },
      },
    ]);
  });
}
