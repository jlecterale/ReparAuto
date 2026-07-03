import React from "react";
import { useCurrentFrame } from "remotion";
import { MagnifyingGlass, ArrowDown, PaperPlaneRight } from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { ListingCard } from "../components/ListingCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";

const INTENTS = [
  {
    title: "Procuro: berlina diesel",
    criteria: "Até 19 000 € · 2018 ou mais recente",
    zone: "Distrito do Porto",
  },
  {
    title: "Procuro: citadino automático",
    criteria: "Até 9 000 € · menos de 120 000 km",
    zone: "Lisboa e arredores",
  },
] as const;

/** Buyer intent cards — the reverse-marketplace differentiator. */
const IntentBoardMock: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 800 }}>
      {INTENTS.map((intent, i) => {
        const enter = fadeUp(frame, 16 + i * 22, 55);
        const scale = popIn(frame, 16 + i * 22);
        return (
          <UiCard
            key={intent.title}
            width="100%"
            style={{
              opacity: enter.opacity,
              translate: enter.translate,
              scale: String(scale),
              padding: "34px 38px",
              display: "flex",
              alignItems: "center",
              gap: 28,
            }}
          >
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: 28,
                background: `${colors.primary}1f`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MagnifyingGlass size={56} weight="bold" color={colors.primary} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 40, color: colors.ink }}>
                {intent.title}
              </span>
              <span style={{ fontWeight: 600, fontSize: 30, color: "#6c6e72" }}>
                {intent.criteria}
              </span>
              <span style={{ fontWeight: 700, fontSize: 28, color: colors.primary }}>
                {intent.zone}
              </span>
            </div>
          </UiCard>
        );
      })}
    </div>
  );
};

/** Your car matching an intent + the reply pill closing the loop. */
const MatchMock: React.FC = () => {
  const frame = useCurrentFrame();
  const car = fadeUp(frame, 10, 55);
  const carScale = popIn(frame, 10);
  const arrow = fadeUp(frame, 52, 30);
  const reply = fadeUp(frame, 68, 45);
  const replyScale = popIn(frame, 68);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div
        style={{
          opacity: car.opacity,
          translate: car.translate,
          scale: String(carScale),
        }}
      >
        <ListingCard
          image="brand/car-2.png"
          title="Mercedes Classe C"
          subtitle="2018 · 98 000 km · Diesel"
          price="18 900 €"
          tag="No teu stock"
          tagColor={colors.primary}
          width={600}
        />
      </div>
      <div style={{ opacity: arrow.opacity, translate: arrow.translate }}>
        <ArrowDown size={48} weight="bold" color={colors.mist} />
      </div>
      <div
        style={{
          opacity: reply.opacity,
          translate: reply.translate,
          scale: String(replyScale),
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: colors.secondary,
          color: colors.white,
          fontFamily: brandFont,
          fontWeight: 800,
          fontSize: 36,
          padding: "26px 40px",
          borderRadius: 999,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <PaperPlaneRight size={44} weight="fill" />
        Tenho exatamente o que procuras
      </div>
    </div>
  );
};

export const leadsScenes: ReelScene[] = [
  {
    durationInFrames: 100,
    content: (
      <HookScene
        kicker="Para stands"
        lines={[
          "E se os compradores",
          <>
            te procurassem <Accent>a ti?</Accent>
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
            eyebrow="Intenções de compra"
            headline={
              <>
                Quem compra diz
                <br />o que procura
              </>
            }
          />
        }
        visual={<IntentBoardMock />}
      />
    ),
  },
  {
    durationInFrames: 200,
    content: (
      <SceneShell
        tint="orange"
        heading={
          <SceneHeading
            eyebrow="Leads qualificados"
            headline={
              <>
                Responde com
                <br />o carro certo
              </>
            }
          />
        }
        visual={<MatchMock />}
      />
    ),
  },
  {
    durationInFrames: 170,
    content: (
      <EndCard
        headline={
          <>
            Deixa os compradores
            <br />
            virem ter contigo.
          </>
        }
      />
    ),
  },
];

/** Reel 03 — buyer intents as qualified leads for dealerships. */
export const LeadsReel: React.FC = () => (
  <Reel scenes={leadsScenes} musicOffsetSeconds={4} />
);
