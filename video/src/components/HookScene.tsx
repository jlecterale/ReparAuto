import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background } from "./Background";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp } from "../anim";

/** Orange-highlighted words inside a hook headline. */
export const Accent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <span style={{ color: colors.secondary }}>{children}</span>;

/**
 * Full-frame opening statement — the first 3 seconds decide the scroll.
 * One entry of `lines` per headline row, revealed with a short stagger, plus
 * an audience kicker pill ("Para oficinas", "Para stands"...).
 */
export const HookScene: React.FC<{
  kicker: string;
  lines: React.ReactNode[];
  tint?: "blue" | "orange";
  fontSize?: number;
}> = ({ kicker, lines, tint = "blue", fontSize = 100 }) => {
  const frame = useCurrentFrame();
  const k = fadeUp(frame, 2);

  return (
    <AbsoluteFill>
      <Background tint={tint} />
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 52,
          padding: "140px 80px",
        }}
      >
        <div
          style={{
            opacity: k.opacity,
            translate: k.translate,
            fontFamily: brandFont,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: colors.mist,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            padding: "14px 36px",
            borderRadius: 999,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            textAlign: "center",
          }}
        >
          {lines.map((line, i) => {
            const a = fadeUp(frame, 12 + i * 9, 70);
            return (
              <div
                key={i}
                style={{
                  opacity: a.opacity,
                  translate: a.translate,
                  fontFamily: brandFont,
                  fontWeight: 800,
                  fontSize,
                  lineHeight: 1.08,
                  letterSpacing: -2,
                  color: colors.white,
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
