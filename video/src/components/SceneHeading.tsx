import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp } from "../anim";

/**
 * Consistent eyebrow + headline block used at the top of every feature scene,
 * so the video keeps a repeated rhythm (per the video-layout guidance).
 */
export const SceneHeading: React.FC<{
  eyebrow: string;
  headline: React.ReactNode;
  accent?: string;
}> = ({ eyebrow, headline, accent = colors.secondary }) => {
  const frame = useCurrentFrame();
  const a = fadeUp(frame, 0);
  const b = fadeUp(frame, 6);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        textAlign: "center",
        paddingInline: 90,
      }}
    >
      <div
        style={{
          opacity: a.opacity,
          translate: a.translate,
          fontFamily: brandFont,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: accent,
          background: `${accent}1f`,
          padding: "12px 28px",
          borderRadius: 999,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          opacity: b.opacity,
          translate: b.translate,
          fontFamily: brandFont,
          fontWeight: 800,
          fontSize: 88,
          lineHeight: 1.05,
          letterSpacing: -1.5,
          color: colors.white,
        }}
      >
        {headline}
      </div>
    </div>
  );
};
