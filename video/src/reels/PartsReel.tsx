import React from "react";
import { useCurrentFrame } from "remotion";
import {
  Gear,
  Lightbulb,
  SteeringWheel,
  Camera,
  Tag,
  CurrencyEur,
} from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { fadeUp, popIn } from "../anim";

const PARTS = [
  { Icon: Gear, name: "Alternador", fit: "Renault Clio IV · usado", price: "85 €" },
  { Icon: Lightbulb, name: "Farol LED direito", fit: "VW Golf VII · como novo", price: "120 €" },
  { Icon: SteeringWheel, name: "Jantes 17'' (conjunto)", fit: "Universal 5×112", price: "260 €" },
] as const;

/** Parts-for-sale rows with price tags popping in. */
const PartsShelfMock: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 820 }}>
      {PARTS.map((part, i) => {
        const enter = fadeUp(frame, 16 + i * 18, 55);
        const scale = popIn(frame, 16 + i * 18);
        const price = popIn(frame, 40 + i * 18);
        return (
          <UiCard
            key={part.name}
            width="100%"
            style={{
              opacity: enter.opacity,
              translate: enter.translate,
              scale: String(scale),
              padding: "30px 36px",
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
                background: `${colors.secondary}1f`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <part.Icon size={56} weight="bold" color={colors.secondary} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 38, color: colors.ink }}>
                {part.name}
              </span>
              <span style={{ fontWeight: 600, fontSize: 28, color: "#6c6e72" }}>
                {part.fit}
              </span>
            </div>
            <div
              style={{
                scale: String(price),
                background: colors.success,
                color: colors.white,
                fontWeight: 800,
                fontSize: 36,
                padding: "16px 30px",
                borderRadius: 999,
                flexShrink: 0,
              }}
            >
              {part.price}
            </div>
          </UiCard>
        );
      })}
    </div>
  );
};

const STEPS = [
  { Icon: Camera, title: "Fotografa", desc: "Uma foto chega para publicar" },
  { Icon: Tag, title: "Publica", desc: "Compatibilidade e preço em minutos" },
  { Icon: CurrencyEur, title: "Vende", desc: "Chega a compradores de todo o país" },
] as const;

/** Three-step flow from shelf to sale. */
const PublishFlowMock: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 780 }}>
      {STEPS.map((step, i) => {
        const enter = fadeUp(frame, 18 + i * 20, 55);
        const scale = popIn(frame, 18 + i * 20);
        return (
          <UiCard
            key={step.title}
            width="100%"
            style={{
              opacity: enter.opacity,
              translate: enter.translate,
              scale: String(scale),
              padding: "32px 38px",
              display: "flex",
              alignItems: "center",
              gap: 30,
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 26,
                background: `${colors.primary}1f`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <step.Icon size={54} weight="bold" color={colors.primary} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 42, color: colors.ink }}>
                {i + 1}. {step.title}
              </span>
              <span style={{ fontWeight: 600, fontSize: 30, color: "#6c6e72" }}>
                {step.desc}
              </span>
            </div>
          </UiCard>
        );
      })}
    </div>
  );
};

export const partsScenes: ReelScene[] = [
  {
    durationInFrames: 105,
    content: (
      <HookScene
        kicker="Para oficinas"
        tint="orange"
        lines={[
          "Essas peças paradas",
          "na prateleira?",
          <Accent key="a">Valem dinheiro.</Accent>,
        ]}
        fontSize={92}
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
            eyebrow="Peças & desmonte"
            headline={
              <>
                Transforma stock
                <br />
                em receita
              </>
            }
          />
        }
        visual={<PartsShelfMock />}
      />
    ),
  },
  {
    durationInFrames: 190,
    content: (
      <SceneShell
        tint="blue"
        heading={
          <SceneHeading
            eyebrow="Publicar é rápido"
            headline={
              <>
                Fotografa,
                <br />
                publica, vende
              </>
            }
            accent={colors.success}
          />
        }
        visual={<PublishFlowMock />}
      />
    ),
  },
  {
    durationInFrames: 170,
    content: (
      <EndCard
        headline={
          <>
            Cada peça parada é
            <br />
            dinheiro à espera.
          </>
        }
      />
    ),
  },
];

/** Reel 09 — workshops selling used parts and dismantling stock. */
export const PartsReel: React.FC = () => (
  <Reel scenes={partsScenes} musicOffsetSeconds={7} />
);
