/**
 * RecarGarage brand tokens for video.
 * Mirrors the marketplace theme in `src/index.css` (@theme block).
 * Public brand name is always "RecarGarage" (one word).
 */

export const colors = {
  // Primary (blue)
  primary: "#155fbf",
  primaryDark: "#0b4f9e",
  primaryDeep: "#0d2f57",
  primaryNight: "#081d38",
  // Secondary (orange)
  secondary: "#ef7c2c",
  secondaryDark: "#db6418",
  // Support
  success: "#10b981",
  white: "#ffffff",
  ink: "#1a1b1c",
  mist: "#d2e3f8",
} as const;

/** Vertical format for Instagram Reels / Stories, YouTube Shorts, TikTok. */
export const format = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/**
 * Scene durations in frames (30 fps). The composition length is derived from
 * these minus the overlapping transition frames — see `Root.tsx`.
 */
export const scenes = {
  hook: 105, // ecosystem positioning + logo
  carros: 140, // used cars, incl. low-cost
  pecas: 130, // parts & dismantling
  oficinas: 155, // workshops/mechanics + "it all connects" flow
  seguranca: 140, // manually verified listings + reviews
  chat: 120, // direct messages
  cta: 200, // available on Web, iOS and Android
} as const;

export const TRANSITION_FRAMES = 15;
