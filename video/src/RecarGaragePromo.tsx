import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Hook } from "./scenes/Hook";
import { Carros } from "./scenes/Carros";
import { Pecas } from "./scenes/Pecas";
import { Oficinas } from "./scenes/Oficinas";
import { Seguranca } from "./scenes/Seguranca";
import { Chat } from "./scenes/Chat";
import { CTA } from "./scenes/CTA";
import { scenes, TRANSITION_FRAMES, colors } from "./theme";

const transition = () => (
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
    presentation={fade()}
  />
);

/**
 * ~30s vertical promo for RecarGarage. Six scenes cross-faded together.
 * Total length is derived in `Root.tsx` from the same `scenes` durations.
 */
export const RecarGaragePromo: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();

  // The track has a long ~7s intro, so skip it (trimBefore) and let the beat
  // play from the very start of the video. Fade in at the start, out at the end.
  const introTrim = 7 * fps;
  const fadeIn = 0.6 * fps;
  const fadeOut = 1.5 * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.primaryNight }}>
      <Audio
        src={staticFile("audio/rockit.mp3")}
        trimBefore={introTrim}
        // Frame is relative to the video start (frame 0 = start of the promo).
        volume={(f) =>
          Math.min(
            interpolate(f, [0, fadeIn], [0, 0.7], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            interpolate(
              f,
              [durationInFrames - fadeOut, durationInFrames],
              [0.7, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            ),
          )
        }
      />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={scenes.hook}>
          <Hook />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={scenes.carros}>
          <Carros />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={scenes.pecas}>
          <Pecas />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={scenes.oficinas}>
          <Oficinas />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={scenes.seguranca}>
          <Seguranca />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={scenes.chat}>
          <Chat />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={scenes.cta}>
          <CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
