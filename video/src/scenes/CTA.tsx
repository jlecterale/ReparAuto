import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { Logo } from "../components/Logo";
import { StoreBadge } from "../components/StoreBadge";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";

/** Closing call-to-action: brand + "available for iOS and Android". */
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = fadeUp(frame, 6);
  const logoScale = popIn(frame, 6);
  const headline = fadeUp(frame, 26);
  const badges = fadeUp(frame, 48);
  const url = fadeUp(frame, 66);

  // Gentle breathing pulse on the CTA line after it lands.
  const pulse = interpolate(
    frame % 60,
    [0, 30, 60],
    [1, 1.03, 1],
    { extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill>
      <Background tint="orange" />
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          padding: 100,
        }}
      >
        <div
          style={{
            opacity: logo.opacity,
            translate: logo.translate,
            scale: String(logoScale),
          }}
        >
          <Logo size={150} layout="stack" />
        </div>

        <div
          style={{
            opacity: headline.opacity,
            translate: headline.translate,
            scale: frame > 40 ? String(pulse) : "1",
            fontFamily: brandFont,
            fontWeight: 800,
            fontSize: 76,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            textAlign: "center",
            color: colors.white,
          }}
        >
          Já disponível na
          <br />
          <span style={{ color: colors.mist }}>Web</span>,{" "}
          <span style={{ color: colors.secondary }}>iOS</span> e{" "}
          <span style={{ color: colors.success }}>Android</span>
        </div>

        <div
          style={{
            opacity: badges.opacity,
            translate: badges.translate,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <StoreBadge platform="web" />
          <StoreBadge platform="ios" />
          <StoreBadge platform="android" />
        </div>

        <div
          style={{
            opacity: url.opacity,
            translate: url.translate,
            fontFamily: brandFont,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: 1,
            color: colors.mist,
          }}
        >
          recargarage.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
