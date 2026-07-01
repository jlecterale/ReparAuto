import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { RecarGaragePromo } from "./RecarGaragePromo";
import { format, scenes, TRANSITION_FRAMES } from "./theme";

// Six cross-fades join the seven scenes; the length is derived from `theme.ts`.
const sceneFrames = Object.values(scenes).reduce((a, b) => a + b, 0);
const TRANSITIONS = Object.keys(scenes).length - 1;
const DURATION = sceneFrames - TRANSITIONS * TRANSITION_FRAMES;

/**
 * The same promo component is rendered at three aspect ratios. Scenes adapt via
 * `useFormat()`, so one component covers Reels/Shorts (9:16), feed (1:1) and
 * YouTube/Google Ads (16:9) — no duplicated scene code.
 */
const FORMATS = [
  { id: "RecarGaragePromo", width: 1080, height: 1920 }, // 9:16 vertical
  { id: "RecarGaragePromoSquare", width: 1080, height: 1080 }, // 1:1 square
  { id: "RecarGaragePromoWide", width: 1920, height: 1080 }, // 16:9 landscape
] as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {FORMATS.map((f) => (
        <Composition
          key={f.id}
          id={f.id}
          component={RecarGaragePromo}
          durationInFrames={DURATION}
          fps={format.fps}
          width={f.width}
          height={f.height}
        />
      ))}
    </>
  );
};
