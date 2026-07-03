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
import { fadeUp, popIn } from "../anim";

const TILES = [
  { Icon: Car, label: "Vende carros", color: colors.primary },
  { Icon: Gear, label: "Vende peças", color: colors.secondary },
  { Icon: Wrench, label: "Recebe clientes", color: colors.success },
  { Icon: ChartLineUp, label: "Acompanha tudo", color: colors.primaryDark },
] as const;

/** 2×2 tile grid: everything a garage business does, in one app. */
const EcosystemGridMock: React.FC = () => {
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
      {TILES.map((tile, i) => {
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

const INCLUDED = [
  "Anúncios sem custos",
  "Chat e notificações incluídos",
  "Painel profissional e CRM",
] as const;

/** "Free to start" checklist pills. */
const IncludedMock: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 760 }}>
      {INCLUDED.map((item, i) => {
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

export const ecosystemScenes: ReelScene[] = [
  {
    durationInFrames: 100,
    content: (
      <HookScene
        kicker="RecarGarage Profissional"
        lines={[
          "O teu negócio automóvel.",
          <Accent key="a">Num só lugar.</Accent>,
        ]}
        fontSize={88}
      />
    ),
  },
  {
    durationInFrames: 210,
    content: (
      <SceneShell
        tint="blue"
        heading={
          <SceneHeading
            eyebrow="Ecossistema"
            headline={
              <>
                Carros, peças,
                <br />
                serviços e clientes
              </>
            }
          />
        }
        visual={<EcosystemGridMock />}
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
            eyebrow="Sem risco"
            headline={
              <>
                Grátis para
                <br />
                começar
              </>
            }
            accent={colors.success}
          />
        }
        visual={<IncludedMock />}
      />
    ),
  },
  {
    durationInFrames: 180,
    content: (
      <EndCard
        headline={
          <>
            Junta-te ao
            <br />
            RecarGarage.
          </>
        }
      />
    ),
  },
];

/** Reel 10 — brand closer: the full professional ecosystem, free to start. */
export const EcosystemReel: React.FC = () => (
  <Reel scenes={ecosystemScenes} musicOffsetSeconds={0} />
);
