import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

/**
 * In-app store review prompts (App Store / Play Store) via expo-store-review.
 *
 * Positive actions accumulate a score; once the score crosses the threshold
 * and the guardrails allow it, the native rating sheet is requested. The OS
 * ultimately decides whether to show it (Apple hard-caps at 3 prompts per
 * 365 days; Play has a similar opaque quota), so `requestReview()` calls we
 * make beyond the quota are silent no-ops — the guardrails below exist to
 * keep our own asks rare and well-timed rather than to enforce the quota.
 */

export type PositiveAction =
  | 'publish-listing'
  | 'submit-review'
  | 'send-message'
  | 'add-favorite';

/** Stronger signals get the prompt sooner (publishing alone crosses the threshold). */
const ACTION_WEIGHTS: Record<PositiveAction, number> = {
  'publish-listing': 5,
  'submit-review': 3,
  'send-message': 1,
  'add-favorite': 1,
};

const PROMPT_SCORE_THRESHOLD = 5;
const PROMPT_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000; // 90 days between asks
const MAX_PROMPTS_PER_YEAR = 3; // mirrors Apple's cap; also protects Android
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
// Let the success alert/navigation settle before the native sheet slides in.
const PROMPT_DELAY_MS = 1000;

const STATE_KEY = 'app_review_state_v1';

interface ReviewState {
  score: number;
  /** Epoch ms of each time we requested the native sheet. */
  promptedAt: number[];
}

async function loadState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReviewState>;
      return {
        score: typeof parsed.score === 'number' ? parsed.score : 0,
        promptedAt: Array.isArray(parsed.promptedAt) ? parsed.promptedAt : [],
      };
    }
  } catch {
    // Corrupt/unreadable state: start over.
  }
  return { score: 0, promptedAt: [] };
}

async function saveState(state: ReviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // best-effort; ignore storage failures.
  }
}

function canPrompt(state: ReviewState, now: number): boolean {
  if (state.score < PROMPT_SCORE_THRESHOLD) return false;
  const lastYear = state.promptedAt.filter((t) => now - t < YEAR_MS);
  if (lastYear.length >= MAX_PROMPTS_PER_YEAR) return false;
  const last = lastYear[lastYear.length - 1];
  if (last !== undefined && now - last < PROMPT_COOLDOWN_MS) return false;
  return true;
}

/**
 * Record a positive action and, when the guardrails allow it, ask the OS for
 * the in-app rating sheet. Fire-and-forget: never throws, safe to call from
 * success handlers without awaiting.
 */
export function trackPositiveAction(action: PositiveAction): void {
  void (async () => {
    try {
      const now = Date.now();
      const state = await loadState();
      state.score += ACTION_WEIGHTS[action];

      if (!canPrompt(state, now)) {
        await saveState(state);
        return;
      }

      if (!(await StoreReview.isAvailableAsync())) {
        await saveState(state);
        return;
      }

      // Count the ask and reset the score before showing the sheet so a crash
      // or race can't re-prompt.
      state.score = 0;
      state.promptedAt = [...state.promptedAt.filter((t) => now - t < YEAR_MS), now];
      await saveState(state);

      setTimeout(() => {
        StoreReview.requestReview().catch(() => {});
      }, PROMPT_DELAY_MS);
    } catch {
      // Never let review bookkeeping break a user flow.
    }
  })();
}
