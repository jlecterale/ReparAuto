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
import { Locale } from "../copy";
import { fadeUp, popIn, easeProgress } from "../anim";

const COPY = {
  pt: {
    kicker: "Para oficinas",
    hookLines: [
      "O próximo negócio",
      "da tua oficina",
      <React.Fragment key="l3">
        custa <Accent>900 €.</Accent>
      </React.Fragment>,
    ],
    car: {
      title: "Renault Clio",
      subtitle: "2005 · 198 000 km · Gasolina",
      price: "900 €",
      tag: "Precisa de manutenção",
    },
    transparency: "Estado declarado no anúncio",
    carEyebrow: "Carros para restaurar",
    carHeadline: (
      <>
        Estado real,
        <br />
        sem surpresas
      </>
    ),
    damages: ["Para-choques", "Porta", "Farolim"],
    aiPill: "Análise de danos com IA",
    aiCaption: "Vê o que precisa de reparação antes de saíres da oficina",
    aiEyebrow: "Vê os danos antes de ir",
    aiHeadline: (
      <>
        A IA marca-os
        <br />
        na foto
      </>
    ),
    flip: [
      { label: "Compra", value: "900 €", color: colors.secondary },
      { label: "Repara", value: "na tua oficina", color: colors.primary },
      { label: "Revende", value: "2 400 €", color: colors.success },
    ],
    flipEyebrow: "O modelo de negócio",
    flipHeadline: (
      <>
        Compra. Repara.
        <br />
        Revende.
      </>
    ),
    endHeadline: (
      <>
        Compra com os
        <br />
        olhos abertos.
      </>
    ),
  },
  br: {
    kicker: "Para oficinas",
    hookLines: [
      "O próximo negócio",
      "da sua oficina",
      <React.Fragment key="l3">
        custa <Accent>R$ 8.500.</Accent>
      </React.Fragment>,
    ],
    car: {
      title: "Renault Clio",
      subtitle: "2005 · 198 000 km · Gasolina",
      price: "R$ 8.500",
      tag: "Precisa de manutenção",
    },
    transparency: "Estado declarado no anúncio",
    carEyebrow: "Carros para restaurar",
    carHeadline: (
      <>
        Estado real,
        <br />
        sem surpresas
      </>
    ),
    damages: ["Para-choque", "Porta", "Lanterna"],
    aiPill: "Análise de danos com IA",
    aiCaption: "Veja o que precisa de reparo antes de sair da oficina",
    aiEyebrow: "Veja os danos antes de ir",
    aiHeadline: (
      <>
        A IA marca tudo
        <br />
        na foto
      </>
    ),
    flip: [
      { label: "Compre", value: "R$ 8.500", color: colors.secondary },
      { label: "Repare", value: "na sua oficina", color: colors.primary },
      { label: "Revenda", value: "R$ 16.900", color: colors.success },
    ],
    flipEyebrow: "O modelo de negócio",
    flipHeadline: (
      <>
        Compre. Repare.
        <br />
        Revenda.
      </>
    ),
    endHeadline: (
      <>
        Compre com os
        <br />
        olhos abertos.
      </>
    ),
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** Project-car listing with the honest condition tag + transparency pill. */
const ProjectCarMock: React.FC<{ c: Copy }> = ({ c }) => {
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
          title={c.car.title}
          subtitle={c.car.subtitle}
          price={c.car.price}
          tag={c.car.tag}
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
        {c.transparency}
      </div>
    </div>
  );
};

const DAMAGE_BOXES = [
  { left: "8%", top: "58%", width: "26%", height: "24%", color: "#e0452b", delay: 46 },
  { left: "38%", top: "48%", width: "22%", height: "20%", color: colors.secondary, delay: 66 },
  { left: "66%", top: "40%", width: "20%", height: "18%", color: "#f2b91d", delay: 86 },
] as const;

/** AI damage analysis: photo with severity-coloured boxes popping in. */
const DamageAnalysisMock: React.FC<{ c: Copy }> = ({ c }) => {
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
        {DAMAGE_BOXES.map((box, i) => {
          const opacity = easeProgress(frame, box.delay, 14);
          const scale = popIn(frame, box.delay);
          const label = c.damages[i];
          return (
            <div
              key={label}
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
                {label}
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
          {c.aiPill}
        </span>
        <span style={{ fontWeight: 600, fontSize: 28, color: "#6c6e72" }}>
          {c.aiCaption}
        </span>
      </div>
    </UiCard>
  );
};

/** Buy → repair → resell margin flow. */
const FlipFlowMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {c.flip.map((step, i) => {
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
                  fontSize: /\d/.test(step.value) ? 42 : 30,
                  color: colors.ink,
                  textAlign: "center",
                }}
              >
                {step.value}
              </span>
            </UiCard>
            {i < c.flip.length - 1 ? (
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

const makeScenes = (locale: Locale): ReelScene[] => {
  const c = COPY[locale];
  return [
    {
      durationInFrames: 105,
      content: <HookScene kicker={c.kicker} lines={[...c.hookLines]} />,
    },
    {
      durationInFrames: 200,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.carEyebrow} headline={c.carHeadline} />}
          visual={<ProjectCarMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 210,
      content: (
        <SceneShell
          tint="orange"
          heading={<SceneHeading eyebrow={c.aiEyebrow} headline={c.aiHeadline} />}
          visual={<DamageAnalysisMock c={c} />}
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
              eyebrow={c.flipEyebrow}
              headline={c.flipHeadline}
              accent={colors.success}
            />
          }
          visual={<FlipFlowMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const repairFlipScenes = makeScenes("pt");
export const repairFlipScenesBR = makeScenes("br");

/** Reel 13 — workshops flipping project cars (honest condition + AI damage). */
export const RepairFlipReel: React.FC = () => (
  <Reel scenes={repairFlipScenes} musicOffsetSeconds={10} />
);

/** Reel 13 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const RepairFlipReelBR: React.FC = () => (
  <Reel scenes={repairFlipScenesBR} musicOffsetSeconds={10} />
);
