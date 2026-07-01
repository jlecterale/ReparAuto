import { useVideoConfig } from "remotion";

export type Orientation = "portrait" | "square" | "landscape";

/**
 * Orientation helper so a single composition component adapts to every format
 * (9:16, 1:1, 16:9). Read this in scenes to switch stacked vs. side-by-side
 * layouts instead of hard-coding pixel positions for one aspect ratio.
 */
export const useFormat = () => {
  const { width, height } = useVideoConfig();
  const ratio = width / height;
  const orientation: Orientation =
    ratio > 1.15 ? "landscape" : ratio < 0.85 ? "portrait" : "square";
  return {
    width,
    height,
    ratio,
    orientation,
    isPortrait: orientation === "portrait",
    isSquare: orientation === "square",
    isLandscape: orientation === "landscape",
  };
};
