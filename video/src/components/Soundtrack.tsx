import React from "react";
import { Audio, interpolate, staticFile, useVideoConfig } from "remotion";

/**
 * Background music shared by every reel: the brand track with a configurable
 * start offset (so consecutive reels don't all open on the same bar), faded
 * in at the start and out at the end of the composition.
 */
export const Soundtrack: React.FC<{
  /** Seconds of the source track to skip before playing. */
  offsetSeconds?: number;
  volume?: number;
}> = ({ offsetSeconds = 7, volume = 0.65 }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = 0.6 * fps;
  const fadeOut = 1.5 * fps;

  return (
    <Audio
      src={staticFile("audio/rockit.mp3")}
      trimBefore={Math.round(offsetSeconds * fps)}
      volume={(f) =>
        Math.min(
          interpolate(f, [0, fadeIn], [0, volume], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          interpolate(
            f,
            [durationInFrames - fadeOut, durationInFrames],
            [volume, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        )
      }
    />
  );
};
