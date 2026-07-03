import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background } from "./Background";
import { Logo } from "./Logo";
import { StoreBadge } from "./StoreBadge";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";

/**
 * Closing CTA shared by every reel: logo, a per-reel closing line, the
 * "free professional account" pill, store badges and the domain.
 */
export const EndCard: React.FC<{
  headline: React.ReactNode;
  cta?: string;
}> = ({ headline, cta = "Cria a tua conta profissional grátis" }) => {
  const frame = useCurrentFrame();
  const logo = fadeUp(frame, 4);
  const logoScale = popIn(frame, 4);
  const h = fadeUp(frame, 24);
  const pill = fadeUp(frame, 44);
  const pillScale = popIn(frame, 44);
  const badges = fadeUp(frame, 62);
  const url = fadeUp(frame, 76);

  return (
    <AbsoluteFill>
      <Background tint="orange" />
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 52,
          padding: "120px 80px",
        }}
      >
        <div
          style={{
            opacity: logo.opacity,
            translate: logo.translate,
            scale: String(logoScale),
          }}
        >
          <Logo size={130} layout="stack" />
        </div>

        <div
          style={{
            opacity: h.opacity,
            translate: h.translate,
            fontFamily: brandFont,
            fontWeight: 800,
            fontSize: 76,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            textAlign: "center",
            color: colors.white,
          }}
        >
          {headline}
        </div>

        <div
          style={{
            opacity: pill.opacity,
            translate: pill.translate,
            scale: String(pillScale),
            fontFamily: brandFont,
            fontWeight: 800,
            fontSize: 40,
            color: colors.white,
            background: colors.secondary,
            padding: "24px 48px",
            borderRadius: 999,
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            textAlign: "center",
          }}
        >
          {cta}
        </div>

        <div
          style={{
            opacity: badges.opacity,
            translate: badges.translate,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
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
