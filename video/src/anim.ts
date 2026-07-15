import { interpolate, Easing } from "remotion";

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Fade + rise entrance. Returns opacity and a translateY string. */
export const fadeUp = (frame: number, delay = 0, distance = 60) => {
  const opacity = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const y = interpolate(frame, [delay, delay + 22], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  return { opacity, translate: `0px ${y}px` };
};

/** Pop-in scale for cards and badges. */
export const popIn = (frame: number, delay = 0) =>
  interpolate(frame, [delay, delay + 20], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

/** Animated count-up for stat numbers (rounds to integers). */
export const countUp = (frame: number, delay: number, to: number, duration = 40) =>
  Math.round(
    interpolate(frame, [delay, delay + duration], [0, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_OUT,
    }),
  );

/** Typewriter reveal: how many characters of `text` are visible. */
export const typeText = (frame: number, delay: number, text: string, charsPerFrame = 1.1) => {
  const chars = Math.max(0, Math.floor((frame - delay) * charsPerFrame));
  return text.slice(0, chars);
};

/**
 * Thousands separator — "1 284" (pt-PT space) or "1.284" (pt-BR dot).
 * Manual because the render browser may lack the pt ICU locales and would
 * silently fall back to "1284".
 */
export const formatThousands = (value: number, separator = "\u2009") =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);

/** Progress 0→1 with the brand ease, for bars/gauges/chart draws. */
export const easeProgress = (frame: number, delay: number, duration = 45) =>
  interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
