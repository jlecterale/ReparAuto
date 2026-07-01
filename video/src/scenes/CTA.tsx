import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background } from "../components/Background";
import { Logo } from "../components/Logo";
import { StoreBadge } from "../components/StoreBadge";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";
import { useFormat } from "../format";

/** Closing call-to-action: brand + "available on iOS, Android and Web". */
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { isLandscape, isPortrait } = useFormat();
  const logo = fadeUp(frame, 6);
  const logoScale = popIn(frame, 6);
  const headline = fadeUp(frame, 26);
  const badges = fadeUp(frame, 48);
  const url = fadeUp(frame, 66);

  return (
    <AbsoluteFill>
      <Background tint="orange" />
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isPortrait ? 56 : 44,
          padding: 80,
        }}
      >
        <div
          style={{
            opacity: logo.opacity,
            translate: logo.translate,
            scale: String(logoScale),
          }}
        >
          <Logo size={isPortrait ? 150 : 120} layout="stack" />
        </div>

        <div
          style={{
            opacity: headline.opacity,
            translate: headline.translate,
            fontFamily: brandFont,
            fontWeight: 800,
            fontSize: isLandscape ? 66 : 74,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            textAlign: "center",
            color: colors.white,
          }}
        >
          <span style={{ color: colors.mist, fontWeight: 700 }}>
            Disponível em:
          </span>
          <br />
          iOS, Android,
          <br />
          Web
        </div>

        <div
          style={{
            opacity: badges.opacity,
            translate: badges.translate,
            display: "flex",
            flexDirection: isPortrait ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <StoreBadge platform="ios" />
          <StoreBadge platform="android" />
          <StoreBadge platform="web" />
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
