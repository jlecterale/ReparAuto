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
import { Locale } from "../copy";
import { fadeUp, popIn } from "../anim";

const COPY = {
  pt: {
    kicker: "Para stands",
    hookLines: [
      "E se os compradores",
      <React.Fragment key="l2">
        te procurassem <Accent>a ti?</Accent>
      </React.Fragment>,
    ],
    intents: [
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
    ],
    intentsEyebrow: "Intenções de compra",
    intentsHeadline: (
      <>
        Quem compra diz
        <br />o que procura
      </>
    ),
    car: {
      title: "Mercedes Classe C",
      subtitle: "2018 · 98 000 km · Diesel",
      price: "18 900 €",
      tag: "No teu stock",
    },
    reply: "Tenho exatamente o que procuras",
    matchEyebrow: "Leads qualificados",
    matchHeadline: (
      <>
        Responde com
        <br />o carro certo
      </>
    ),
    endHeadline: (
      <>
        Deixa os compradores
        <br />
        virem ter contigo.
      </>
    ),
  },
  br: {
    kicker: "Para lojistas",
    hookLines: [
      "E se os compradores",
      <React.Fragment key="l2">
        procurassem <Accent>você?</Accent>
      </React.Fragment>,
    ],
    intents: [
      {
        title: "Procuro: sedã diesel",
        criteria: "Até R$ 120 mil · 2018 ou mais novo",
        zone: "Grande São Paulo",
      },
      {
        title: "Procuro: hatch automático",
        criteria: "Até R$ 60 mil · menos de 120 000 km",
        zone: "Curitiba e região",
      },
    ],
    intentsEyebrow: "Intenções de compra",
    intentsHeadline: (
      <>
        Quem compra diz
        <br />o que procura
      </>
    ),
    car: {
      title: "Mercedes Classe C",
      subtitle: "2018 · 98 000 km · Diesel",
      price: "R$ 165.900",
      tag: "No seu estoque",
    },
    reply: "Tenho exatamente o que você procura",
    matchEyebrow: "Leads qualificados",
    matchHeadline: (
      <>
        Responda com
        <br />o carro certo
      </>
    ),
    endHeadline: (
      <>
        Deixe os compradores
        <br />
        virem até você.
      </>
    ),
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** Buyer intent cards — the reverse-marketplace differentiator. */
const IntentBoardMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 800 }}>
      {c.intents.map((intent, i) => {
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
const MatchMock: React.FC<{ c: Copy }> = ({ c }) => {
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
          title={c.car.title}
          subtitle={c.car.subtitle}
          price={c.car.price}
          tag={c.car.tag}
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
        {c.reply}
      </div>
    </div>
  );
};

const makeScenes = (locale: Locale): ReelScene[] => {
  const c = COPY[locale];
  return [
    {
      durationInFrames: 100,
      content: <HookScene kicker={c.kicker} lines={[...c.hookLines]} />,
    },
    {
      durationInFrames: 200,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.intentsEyebrow} headline={c.intentsHeadline} />}
          visual={<IntentBoardMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 200,
      content: (
        <SceneShell
          tint="orange"
          heading={<SceneHeading eyebrow={c.matchEyebrow} headline={c.matchHeadline} />}
          visual={<MatchMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const leadsScenes = makeScenes("pt");
export const leadsScenesBR = makeScenes("br");

/** Reel 03 — buyer intents as qualified leads for dealerships. */
export const LeadsReel: React.FC = () => (
  <Reel scenes={leadsScenes} musicOffsetSeconds={4} />
);

/** Reel 03 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const LeadsReelBR: React.FC = () => (
  <Reel scenes={leadsScenesBR} musicOffsetSeconds={4} />
);
