import React from "react";
import { useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";

const CATEGORIES = [
  "Motor",
  "Travões",
  "Suspensão",
  "Faróis",
  "Pneus",
  "Eletrónica",
];

const HexBullet: React.FC<{ color: string }> = ({ color }) => (
  <svg width={54} height={54} viewBox="0 0 100 100">
    <polygon
      points="50,4 90,27 90,73 50,96 10,73 10,27"
      fill={color}
      opacity={0.9}
    />
    <polygon points="50,26 71,38 71,62 50,74 29,62 29,38" fill={colors.white} />
  </svg>
);

/** Feature 2 — parts and dismantling ("desmonte"). */
export const Pecas: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneShell
      tint="orange"
      heading={
        <SceneHeading
          eyebrow="Peças & desmonte"
          headline={
            <>
              A peça certa para
              <br />o teu carro
            </>
          }
          accent={colors.secondary}
        />
      }
      visual={
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 26,
            width: 760,
          }}
        >
          {CATEGORIES.map((label, i) => {
            const enter = fadeUp(frame, 26 + i * 6, 50);
            const scale = popIn(frame, 26 + i * 6);
            return (
              <div
                key={label}
                style={{
                  opacity: enter.opacity,
                  translate: enter.translate,
                  scale: String(scale),
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 28,
                  padding: "30px 34px",
                }}
              >
                <HexBullet
                  color={i % 2 === 0 ? colors.secondary : colors.primary}
                />
                <span
                  style={{
                    fontFamily: brandFont,
                    fontWeight: 700,
                    fontSize: 42,
                    color: colors.white,
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      }
    />
  );
};
