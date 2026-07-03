import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { SealCheck, Storefront, IdentificationCard } from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";

/** Seller card receiving the blue "Verificado" seal. */
const SealMock: React.FC = () => {
  const frame = useCurrentFrame();
  const card = fadeUp(frame, 12, 55);
  const cardScale = popIn(frame, 12);
  const seal = popIn(frame, 58);
  const sealOpacity = interpolate(frame, [58, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pills = fadeUp(frame, 92, 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <UiCard
        width={760}
        style={{
          opacity: card.opacity,
          translate: card.translate,
          scale: String(cardScale),
          padding: "42px 44px",
          display: "flex",
          alignItems: "center",
          gap: 30,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 30,
            background: `${colors.primary}1f`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Storefront size={64} weight="bold" color={colors.primary} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 44, color: colors.ink }}>
            Stand Silva Automóveis
          </span>
          <span style={{ fontWeight: 600, fontSize: 30, color: "#6c6e72" }}>
            34 anúncios ativos
          </span>
        </div>
        <div
          style={{
            opacity: sealOpacity,
            scale: String(seal),
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: colors.primary,
            color: colors.white,
            fontWeight: 800,
            fontSize: 30,
            padding: "16px 28px",
            borderRadius: 999,
            flexShrink: 0,
          }}
        >
          <SealCheck size={40} weight="fill" />
          Verificado
        </div>
      </UiCard>

      <div
        style={{
          opacity: pills.opacity,
          translate: pills.translate,
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {["NIF confirmado", "Selo em todos os anúncios"].map((label) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.22)",
              color: colors.white,
              fontFamily: brandFont,
              fontWeight: 700,
              fontSize: 30,
              padding: "16px 30px",
              borderRadius: 999,
            }}
          >
            <IdentificationCard size={38} weight="bold" color={colors.mist} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

const RESULTS = [
  { name: "Renault Mégane 1.5", seller: "Anúncio particular", verified: false, slotFrom: 0, slotTo: 1 },
  { name: "Seat Leon 2.0 TDI", seller: "Anúncio particular", verified: false, slotFrom: 1, slotTo: 2 },
  { name: "Peugeot 308 1.2 PureTech", seller: "Stand Silva · Verificado", verified: true, slotFrom: 2, slotTo: 0 },
] as const;

const ROW_HEIGHT = 150;
const ROW_GAP = 26;

/** Search results reordering: the verified listing climbs to the top. */
const RankingMock: React.FC = () => {
  const frame = useCurrentFrame();
  const move = interpolate(frame, [64, 96], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "relative",
        width: 800,
        height: RESULTS.length * ROW_HEIGHT + (RESULTS.length - 1) * ROW_GAP,
      }}
    >
      {RESULTS.map((r, i) => {
        const enter = fadeUp(frame, 12 + i * 14, 50);
        const y =
          interpolate(move, [0, 1], [r.slotFrom, r.slotTo]) *
          (ROW_HEIGHT + ROW_GAP);
        return (
          <UiCard
            key={r.name}
            width="100%"
            style={{
              position: "absolute",
              top: y,
              left: 0,
              height: ROW_HEIGHT,
              opacity: enter.opacity,
              translate: enter.translate,
              padding: "0 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              border: r.verified ? `4px solid ${colors.primary}` : undefined,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 36, color: colors.ink }}>
                {r.name}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 28,
                  color: r.verified ? colors.primary : "#6c6e72",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {r.verified ? <SealCheck size={34} weight="fill" color={colors.primary} /> : null}
                {r.seller}
              </span>
            </div>
            {r.verified ? (
              <div
                style={{
                  background: `${colors.primary}1f`,
                  color: colors.primary,
                  fontWeight: 800,
                  fontSize: 28,
                  padding: "12px 24px",
                  borderRadius: 999,
                  flexShrink: 0,
                }}
              >
                1.º lugar
              </div>
            ) : null}
          </UiCard>
        );
      })}
    </div>
  );
};

export const verifiedSellerScenes: ReelScene[] = [
  {
    durationInFrames: 100,
    content: (
      <HookScene
        kicker="Para stands"
        lines={[
          "Porque é que",
          "uns anúncios",
          <Accent key="a">vendem primeiro?</Accent>,
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
            eyebrow="Vendedor Verificado"
            headline={
              <>
                O selo que
                <br />
                gera confiança
              </>
            }
            accent={colors.primary}
          />
        }
        visual={<SealMock />}
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
            eyebrow="Prioridade nos resultados"
            headline={
              <>
                Apareces primeiro
                <br />a quem procura
              </>
            }
          />
        }
        visual={<RankingMock />}
      />
    ),
  },
  {
    durationInFrames: 170,
    content: (
      <EndCard
        headline={
          <>
            Confiança vende.
            <br />
            Verifica o teu stand.
          </>
        }
      />
    ),
  },
];

/** Reel 04 — verified seller badge + ranking priority for dealerships. */
export const VerifiedSellerReel: React.FC = () => (
  <Reel scenes={verifiedSellerScenes} musicOffsetSeconds={10} />
);
