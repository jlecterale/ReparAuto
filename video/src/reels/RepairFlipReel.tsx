import React from "react";
import { useCurrentFrame, Img, staticFile } from "remotion";
import { ShieldCheck, ArrowRight } from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { ListingCard } from "../components/ListingCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn, easeProgress } from "../anim";

/** Project-car listing with the honest condition tag + transparency pill. */
const ProjectCarMock: React.FC = () => {
  const frame = useCurrentFrame();
  const card = fadeUp(frame, 10, 55);
  const cardScale = popIn(frame, 10);
  const pill = fadeUp(frame, 74, 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <div
        style={{
          opacity: card.opacity,
          translate: card.translate,
          scale: String(cardScale),
        }}
      >
        <ListingCard
          image="images/clio-low-cost.jpg"
          title="Renault Clio"
          subtitle="2005 · 198 000 km · Gasolina"
          price="900 €"
          tag="Precisa de manutenção"
          tagColor={colors.secondary}
          width={640}
        />
      </div>
      <div
        style={{
          opacity: pill.opacity,
          translate: pill.translate,
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.22)",
          color: colors.white,
          fontFamily: brandFont,
          fontWeight: 700,
          fontSize: 32,
          padding: "18px 34px",
          borderRadius: 999,
        }}
      >
        <ShieldCheck size={40} weight="bold" color={colors.mist} />
        Estado declarado no anúncio
      </div>
    </div>
  );
};

const DAMAGE_BOXES = [
  { left: "8%", top: "58%", width: "26%", height: "24%", label: "Para-choques", color: "#e0452b", delay: 46 },
  { left: "38%", top: "48%", width: "22%", height: "20%", label: "Porta", color: colors.secondary, delay: 66 },
  { left: "66%", top: "40%", width: "20%", height: "18%", label: "Farolim", color: "#f2b91d", delay: 86 },
] as const;

/** AI damage analysis: photo with severity-coloured boxes popping in. */
const DamageAnalysisMock: React.FC = () => {
  const frame = useCurrentFrame();
  const card = fadeUp(frame, 10, 55);
  const cardScale = popIn(frame, 10);

  return (
    <UiCard
      width={780}
      style={{
        opacity: card.opacity,
        translate: card.translate,
        scale: String(cardScale),
      }}
    >
      <div style={{ position: "relative", height: 480 }}>
        <Img
          src={staticFile("images/clio-low-cost.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {DAMAGE_BOXES.map((box) => {
          const opacity = easeProgress(frame, box.delay, 14);
          const scale = popIn(frame, box.delay);
          return (
            <div
              key={box.label}
              style={{
                position: "absolute",
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
                opacity,
                scale: String(scale),
                border: `6px solid ${box.color}`,
                borderRadius: 16,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: -46,
                  left: -6,
                  background: box.color,
                  color: colors.white,
                  fontFamily: brandFont,
                  fontWeight: 800,
                  fontSize: 26,
                  padding: "6px 16px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                {box.label}
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          padding: "28px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: 30,
            color: colors.primary,
            background: `${colors.primary}1f`,
            padding: "10px 22px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          Análise de danos com IA
        </span>
        <span style={{ fontWeight: 600, fontSize: 28, color: "#6c6e72" }}>
          Vê o que precisa de reparação antes de saíres da oficina
        </span>
      </div>
    </UiCard>
  );
};

const FLIP_STEPS = [
  { label: "Compra", value: "900 €", color: colors.secondary },
  { label: "Repara", value: "na tua oficina", color: colors.primary },
  { label: "Revende", value: "2 400 €", color: colors.success },
] as const;

/** Buy → repair → resell margin flow. */
const FlipFlowMock: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {FLIP_STEPS.map((step, i) => {
        const enter = fadeUp(frame, 16 + i * 22, 50);
        const scale = popIn(frame, 16 + i * 22);
        const arrow = easeProgress(frame, 30 + i * 22, 14);
        return (
          <React.Fragment key={step.label}>
            <UiCard
              width={230}
              style={{
                opacity: enter.opacity,
                translate: enter.translate,
                scale: String(scale),
                padding: "34px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 28,
                  color: step.color,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                {step.label}
              </span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: step.value.includes("€") ? 44 : 30,
                  color: colors.ink,
                  textAlign: "center",
                }}
              >
                {step.value}
              </span>
            </UiCard>
            {i < FLIP_STEPS.length - 1 ? (
              <div style={{ opacity: arrow }}>
                <ArrowRight size={44} weight="bold" color={colors.mist} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const repairFlipScenes: ReelScene[] = [
  {
    durationInFrames: 105,
    content: (
      <HookScene
        kicker="Para oficinas"
        lines={[
          "O próximo negócio",
          "da tua oficina",
          <>
            custa <Accent>900 €.</Accent>
          </>,
        ]}
      />
    ),
  },
  {
    durationInFrames: 200,
    content: (
      <SceneShell
        tint="blue"
        heading={
          <SceneHeading
            eyebrow="Carros para restaurar"
            headline={
              <>
                Estado real,
                <br />
                sem surpresas
              </>
            }
          />
        }
        visual={<ProjectCarMock />}
      />
    ),
  },
  {
    durationInFrames: 210,
    content: (
      <SceneShell
        tint="orange"
        heading={
          <SceneHeading
            eyebrow="Vê os danos antes de ir"
            headline={
              <>
                A IA marca-os
                <br />
                na foto
              </>
            }
          />
        }
        visual={<DamageAnalysisMock />}
      />
    ),
  },
  {
    durationInFrames: 180,
    content: (
      <SceneShell
        tint="blue"
        heading={
          <SceneHeading
            eyebrow="O modelo de negócio"
            headline={
              <>
                Compra. Repara.
                <br />
                Revende.
              </>
            }
            accent={colors.success}
          />
        }
        visual={<FlipFlowMock />}
      />
    ),
  },
  {
    durationInFrames: 170,
    content: (
      <EndCard
        headline={
          <>
            Compra com os
            <br />
            olhos abertos.
          </>
        }
      />
    ),
  },
];

/** Reel 13 — workshops flipping project cars (honest condition + AI damage). */
export const RepairFlipReel: React.FC = () => (
  <Reel scenes={repairFlipScenes} musicOffsetSeconds={10} />
);
