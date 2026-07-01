import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { Logo } from "../components/Logo";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";
import { useFormat } from "../format";

/** Opening hook: grabs attention, then reveals the brand. */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { isLandscape } = useFormat();
  const logo = fadeUp(frame, 8);
  const line = fadeUp(frame, 34);
  const scale = popIn(frame, 8);
  const sub = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background tint="blue" />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: isLandscape ? 44 : 60,
          padding: 100,
        }}
      >
        <div
          style={{
            opacity: logo.opacity,
            translate: logo.translate,
            scale: String(scale),
          }}
        >
          <Logo size={isLandscape ? 130 : 170} layout="stack" />
        </div>

        <div
          style={{
            opacity: line.opacity,
            translate: line.translate,
            fontFamily: brandFont,
            fontWeight: 800,
            fontSize: isLandscape ? 72 : 82,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            textAlign: "center",
            color: colors.white,
          }}
        >
          Mais do que
          <br />
          comprar e vender.
        </div>

        <div
          style={{
            opacity: sub,
            fontFamily: brandFont,
            fontWeight: 600,
            fontSize: 40,
            color: colors.mist,
            textAlign: "center",
            paddingInline: 40,
          }}
        >
          Carros, peças e oficinas num só lugar
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
