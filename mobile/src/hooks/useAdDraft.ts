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
  const { user } = useAuth();
  const navigation = useNavigation();
  const promptedRef = useRef(false);
  // Keep the latest restore callback without re-running the prompt effect.
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // Offer to resume a saved draft. Re-runs when auth resolves, because an
  // owned draft is invisible until the uid is known.
  useEffect(() => {
    if (!enabled || promptedRef.current) return;
    let cancelled = false;
    loadAdDraft<T>(kind, user?.uid ?? null).then((draft) => {
      if (cancelled || !draft || promptedRef.current) return;
      promptedRef.current = true;
      if (resumeImmediately) {
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
  }, [enabled, user?.uid]);

  // Autosave the draft (debounced) so progress survives even an app kill.
  useEffect(() => {
    if (!enabled || submitting || submitted || !hasContent) return;
    const timer = setTimeout(() => {
      saveAdDraft(kind, data, user?.uid ?? null);
    }, 800);
    return () => clearTimeout(timer);
  }, [data, enabled, submitting, submitted, hasContent, kind, user?.uid]);

  // Leaving with unpublished work: ask to keep the draft, discard, or stay.
  usePreventRemove(enabled && hasContent && !submitting && !submitted, ({ data: event }) => {
    Alert.alert('Sair sem publicar?', 'Pode guardar um rascunho neste dispositivo e continuar mais tarde.', [
      { text: 'Continuar a editar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          clearAdDraft(kind).finally(() => navigation.dispatch(event.action));
        },
      },
      {
        text: 'Guardar rascunho',
        onPress: () => {
          saveAdDraft(kind, data, user?.uid ?? null).finally(() => navigation.dispatch(event.action));
        },
      },
    ]);
  });
}
