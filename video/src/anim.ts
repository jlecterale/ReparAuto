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
