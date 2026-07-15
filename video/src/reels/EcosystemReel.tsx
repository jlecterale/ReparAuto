import React from "react";
import { useCurrentFrame } from "remotion";
import {
  Car,
  Gear,
  Wrench,
  ChartLineUp,
  CheckCircle,
} from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { Locale } from "../copy";
import { fadeUp, popIn } from "../anim";

const COPY = {
  pt: {
    kicker: "RecarGarage Profissional",
    hookLines: [
      "O teu negócio automóvel.",
      <Accent key="l2">Num só lugar.</Accent>,
    ],
    tiles: [
      { Icon: Car, label: "Vende carros", color: colors.primary },
      { Icon: Gear, label: "Vende peças", color: colors.secondary },
      { Icon: Wrench, label: "Recebe clientes", color: colors.success },
      { Icon: ChartLineUp, label: "Acompanha tudo", color: colors.primaryDark },
    ],
    gridEyebrow: "Ecossistema",
    gridHeadline: (
      <>
        Carros, peças,
        <br />
        serviços e clientes
      </>
    ),
    included: [
      "Anúncios sem custos",
      "Chat e notificações incluídos",
      "Painel profissional e CRM",
    ],
    includedEyebrow: "Sem risco",
    includedHeadline: (
      <>
        Grátis para
        <br />
        começar
      </>
    ),
    endHeadline: (
      <>
        Junta-te ao
        <br />
        RecarGarage.
      </>
    ),
  },
  br: {
    kicker: "RecarGarage Profissional",
    hookLines: [
      "Seu negócio automotivo.",
      <Accent key="l2">Num só lugar.</Accent>,
    ],
    tiles: [
      { Icon: Car, label: "Venda carros", color: colors.primary },
      { Icon: Gear, label: "Venda peças", color: colors.secondary },
      { Icon: Wrench, label: "Receba clientes", color: colors.success },
      { Icon: ChartLineUp, label: "Acompanhe tudo", color: colors.primaryDark },
    ],
    gridEyebrow: "Ecossistema",
    gridHeadline: (
      <>
        Carros, peças,
        <br />
        serviços e clientes
      </>
    ),
    included: [
      "Anúncios sem custos",
      "Chat e notificações incluídos",
      "Painel profissional e CRM",
    ],
    includedEyebrow: "Sem risco",
    includedHeadline: (
      <>
        Grátis para
        <br />
        começar
      </>
    ),
    endHeadline: (
      <>
        Junte-se ao
        <br />
        RecarGarage.
      </>
    ),
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** 2×2 tile grid: everything a garage business does, in one app. */
const EcosystemGridMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 26,
        width: 800,
      }}
    >
      {c.tiles.map((tile, i) => {
        const enter = fadeUp(frame, 14 + i * 14, 55);
        const scale = popIn(frame, 14 + i * 14);
        return (
          <UiCard
            key={tile.label}
            width="100%"
            style={{
              opacity: enter.opacity,
              translate: enter.translate,
              scale: String(scale),
              padding: "44px 30px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 22,
            }}
          >
            <div
              style={{
                width: 130,
                height: 130,
                borderRadius: 34,
                background: `${tile.color}1f`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <tile.Icon size={72} weight="bold" color={tile.color} />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 38,
                color: colors.ink,
                textAlign: "center",
              }}
            >
              {tile.label}
            </span>
          </UiCard>
        );
      })}
    </div>
  );
};

/** "Free to start" checklist pills. */
const IncludedMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 760 }}>
      {c.included.map((item, i) => {
        const enter = fadeUp(frame, 18 + i * 18, 50);
        const scale = popIn(frame, 18 + i * 18);
        return (
          <UiCard
            key={item}
            width="100%"
            style={{
              opacity: enter.opacity,
              translate: enter.translate,
              scale: String(scale),
              padding: "32px 38px",
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <CheckCircle size={56} weight="fill" color={colors.success} style={{ flexShrink: 0 }} />
            <span
              style={{
                fontFamily: brandFont,
                fontWeight: 800,
                fontSize: 40,
                color: colors.ink,
              }}
            >
              {item}
            </span>
          </UiCard>
        );
      })}
    </div>
  );
};

const makeScenes = (locale: Locale): ReelScene[] => {
  const c = COPY[locale];
  return [
    {
      durationInFrames: 100,
      content: (
        <HookScene kicker={c.kicker} lines={[...c.hookLines]} fontSize={88} />
      ),
    },
    {
      durationInFrames: 210,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.gridEyebrow} headline={c.gridHeadline} />}
          visual={<EcosystemGridMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 190,
      content: (
        <SceneShell
          tint="orange"
          heading={
            <SceneHeading
              eyebrow={c.includedEyebrow}
              headline={c.includedHeadline}
              accent={colors.success}
            />
          }
          visual={<IncludedMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 180,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const ecosystemScenes = makeScenes("pt");
export const ecosystemScenesBR = makeScenes("br");

/** Reel 10 — brand closer: the full professional ecosystem, free to start. */
export const EcosystemReel: React.FC = () => (
  <Reel scenes={ecosystemScenes} musicOffsetSeconds={0} />
);

/** Reel 10 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const EcosystemReelBR: React.FC = () => (
  <Reel scenes={ecosystemScenesBR} musicOffsetSeconds={0} />
);
