import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { MagnifyingGlass, Wrench, Car, CaretDown } from "@phosphor-icons/react";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";

const STEPS = [
  {
    Icon: MagnifyingGlass,
    title: "Procura a peça",
    desc: "Peças novas, usadas e de desmonte",
    color: colors.secondary,
  },
  {
    Icon: Wrench,
    title: "Encontra o mecânico",
    desc: "Oficinas e mecânicos perto de ti",
    color: colors.success,
  },
  {
    Icon: Car,
    title: "Vende o carro",
    desc: "Anuncia e fecha negócio",
    color: colors.primary,
  },
];

/**
 * Feature — the ecosystem's differentiator: parts, mechanics/workshops and
 * cars all connected. Mirrors the site's "Um ecossistema que se conecta" flow.
 */
export const Oficinas: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneShell
      tint="blue"
      heading={
        <SceneHeading
          eyebrow="Oficinas & Mecânicos"
          headline={
            <>
              Tudo ligado
              <br />
              num só lugar
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
            alignItems: "center",
            gap: 8,
            width: 760,
          }}
        >
          {STEPS.map((step, i) => {
            const enter = fadeUp(frame, 26 + i * 18, 60);
            const scale = popIn(frame, 26 + i * 18);
            const arrow = interpolate(
              frame,
              [38 + i * 18, 50 + i * 18],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return (
              <React.Fragment key={step.title}>
                <div
                  style={{
                    opacity: enter.opacity,
                    translate: enter.translate,
                    scale: String(scale),
                    display: "flex",
                    alignItems: "center",
                    gap: 30,
                    width: "100%",
                    background: colors.white,
                    borderRadius: 30,
                    padding: "30px 38px",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    style={{
                      width: 92,
                      height: 92,
                      borderRadius: 24,
                      background: `${step.color}1f`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <step.Icon size={52} weight="bold" color={step.color} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontFamily: brandFont,
                        fontWeight: 800,
                        fontSize: 46,
                        color: colors.ink,
                      }}
                    >
                      {step.title}
                    </span>
                    <span
                      style={{
                        fontFamily: brandFont,
                        fontWeight: 500,
                        fontSize: 30,
                        color: "#6c6e72",
                      }}
                    >
                      {step.desc}
                    </span>
                  </div>
                </div>
                {i < STEPS.length - 1 ? (
                  <div style={{ opacity: arrow }}>
                    <CaretDown size={44} weight="bold" color={colors.mist} />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      }
    />
  );
};
