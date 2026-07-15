import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Soundtrack } from "./Soundtrack";
import { colors, TRANSITION_FRAMES } from "../theme";

export type ReelScene = {
  durationInFrames: number;
  content: React.ReactNode;
};

/** Total composition length for a list of reel scenes (cross-fades overlap). */
export const reelDuration = (scenes: ReelScene[]) =>
  scenes.reduce((sum, s) => sum + s.durationInFrames, 0) -
  (scenes.length - 1) * TRANSITION_FRAMES;

/**
 * Skeleton shared by every Instagram reel: the scenes cross-faded in order
 * over the brand soundtrack. Individual reel files only declare their scenes
 * (hook → feature beats → end card) and copy.
 */
export const Reel: React.FC<{
  scenes: ReelScene[];
  musicOffsetSeconds?: number;
}> = ({ scenes, musicOffsetSeconds }) => {
  const children: React.ReactNode[] = [];
  scenes.forEach((s, i) => {
    if (i > 0) {
      children.push(
        <TransitionSeries.Transition
          key={`transition-${i}`}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={fade()}
        />,
      );
    }
    children.push(
      <TransitionSeries.Sequence
        key={`scene-${i}`}
        durationInFrames={s.durationInFrames}
      >
        {s.content}
      </TransitionSeries.Sequence>,
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.primaryNight }}>
      <Soundtrack offsetSeconds={musicOffsetSeconds} />
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
};
