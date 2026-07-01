import React from "react";
import { useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";

const POINTS = [
  {
    title: "Anúncios verificados",
    desc: "Revistos manualmente pela equipa",
  },
  { title: "Avaliações reais", desc: "Reputação de quem compra e vende" },
  { title: "Vendedores de confiança", desc: "Perfis validados e moderados" },
];

const CheckMark: React.FC = () => (
  <svg width={64} height={64} viewBox="0 0 100 100">
    <circle cx={50} cy={50} r={46} fill={colors.success} />
    <path
      d="M30 52 L45 66 L72 36"
      fill="none"
      stroke={colors.white}
      strokeWidth={9}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Feature 3 — buy and sell with confidence. */
export const Seguranca: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneShell
      tint="blue"
      heading={
        <SceneHeading
          eyebrow="Confiança"
          headline={
            <>
              Compra e vende
              <br />
              com segurança
            </>
          }
          accent={colors.success}
        />
      }
      visual={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
            width: 760,
          }}
        >
          {POINTS.map((p, i) => {
            const enter = fadeUp(frame, 28 + i * 10, 60);
            const scale = popIn(frame, 28 + i * 10);
            return (
              <div
                key={p.title}
                style={{
                  opacity: enter.opacity,
                  translate: enter.translate,
                  scale: String(scale),
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  background: colors.white,
                  borderRadius: 30,
                  padding: "32px 38px",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
                }}
              >
                <CheckMark />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontFamily: brandFont,
                      fontWeight: 800,
                      fontSize: 46,
                      color: colors.ink,
                    }}
                  >
                    {p.title}
                  </span>
                  <span
                    style={{
                      fontFamily: brandFont,
                      fontWeight: 500,
                      fontSize: 32,
                      color: "#6c6e72",
                    }}
                  >
                    {p.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      }
    />
  );
};
