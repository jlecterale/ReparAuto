import React from "react";
import { useCurrentFrame, Img, staticFile, interpolate } from "remotion";
import { Sparkle, CheckCircle } from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn, typeText, countUp, formatThousands } from "../anim";

const AI_DESCRIPTION =
  "BMW Série 3 em excelente estado, revisões na marca e pneus novos. Interior impecável, ideal para quem procura conforto e fiabilidade.";

/** Listing form: photo + "Gerar com IA" button + typewriter description. */
const AiDescriptionMock: React.FC = () => {
  const frame = useCurrentFrame();
  const card = fadeUp(frame, 10, 55);
  const cardScale = popIn(frame, 10);
  // Button "press": quick pulse down and back around frame 50.
  const press = interpolate(frame, [46, 52, 58], [1, 0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const typed = typeText(frame, 64, AI_DESCRIPTION, 1.6);
  const badge = popIn(frame, 168);
  const badgeOpacity = interpolate(frame, [168, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <UiCard
      width={780}
      style={{
        opacity: card.opacity,
        translate: card.translate,
        scale: String(cardScale),
      }}
    >
      <div style={{ position: "relative", height: 360 }}>
        <Img
          src={staticFile("brand/car-1.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div style={{ padding: "34px 40px", display: "flex", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            scale: String(press),
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: colors.secondary,
            color: colors.white,
            fontWeight: 800,
            fontSize: 34,
            padding: "20px 36px",
            borderRadius: 999,
          }}
        >
          <Sparkle size={42} weight="fill" />
          Gerar com IA
        </div>

        <div
          style={{
            minHeight: 220,
            background: "#f4f7fb",
            borderRadius: 24,
            padding: "26px 30px",
            fontWeight: 600,
            fontSize: 32,
            lineHeight: 1.4,
            color: colors.ink,
          }}
        >
          {typed}
          <span style={{ opacity: frame % 20 < 10 && typed.length < AI_DESCRIPTION.length ? 1 : 0 }}>
            |
          </span>
        </div>

        <div
          style={{
            opacity: badgeOpacity,
            scale: String(badge),
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: `${colors.primary}1f`,
            color: colors.primary,
            fontWeight: 800,
            fontSize: 28,
            padding: "12px 24px",
            borderRadius: 999,
          }}
        >
          <Sparkle size={32} weight="fill" />
          Gerada com IA — edita à vontade
        </div>
      </div>
    </UiCard>
  );
};

const PRICE_TIERS = [
  { label: "Mínimo", value: 11900, highlight: false },
  { label: "Recomendado", value: 13400, highlight: true },
  { label: "Máximo", value: 14800, highlight: false },
] as const;

/** Price suggestion widget anchored on real market medians. */
const PriceSuggestionMock: React.FC = () => {
  const frame = useCurrentFrame();
  const cta = fadeUp(frame, 96, 40);
  const ctaScale = popIn(frame, 96);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <div style={{ display: "flex", gap: 22 }}>
        {PRICE_TIERS.map((tier, i) => {
          const enter = fadeUp(frame, 14 + i * 14, 50);
          const scale = popIn(frame, 14 + i * 14);
          const value = countUp(frame, 24 + i * 14, tier.value, 45);
          return (
            <UiCard
              key={tier.label}
              width={tier.highlight ? 320 : 250}
              style={{
                opacity: enter.opacity,
                translate: enter.translate,
                scale: String(scale),
                padding: tier.highlight ? "38px 26px" : "30px 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                border: tier.highlight ? `5px solid ${colors.secondary}` : undefined,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 28,
                  color: tier.highlight ? colors.secondaryDark : "#6c6e72",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                {tier.label}
              </span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: tier.highlight ? 54 : 42,
                  color: colors.ink,
                }}
              >
                {formatThousands(value)} €
              </span>
            </UiCard>
          );
        })}
      </div>

      <div
        style={{
          opacity: cta.opacity,
          translate: cta.translate,
          scale: String(ctaScale),
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: colors.success,
          color: colors.white,
          fontFamily: brandFont,
          fontWeight: 800,
          fontSize: 36,
          padding: "24px 44px",
          borderRadius: 999,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <CheckCircle size={44} weight="fill" />
        Usar este preço
      </div>

      <div
        style={{
          opacity: cta.opacity,
          fontFamily: brandFont,
          fontWeight: 600,
          fontSize: 30,
          color: colors.mist,
          textAlign: "center",
        }}
      >
        Baseado em anúncios reais comparáveis
      </div>
    </div>
  );
};

export const aiListingScenes: ReelScene[] = [
  {
    durationInFrames: 100,
    content: (
      <HookScene
        kicker="Para stands"
        tint="orange"
        lines={[
          "Anuncia um carro",
          <>
            em <Accent>60 segundos.</Accent>
          </>,
        ]}
      />
    ),
  },
  {
    durationInFrames: 230,
    content: (
      <SceneShell
        tint="orange"
        heading={
          <SceneHeading
            eyebrow="Anúncios com IA"
            headline={
              <>
                A descrição
                <br />
                escreve-se sozinha
              </>
            }
          />
        }
        visual={<AiDescriptionMock />}
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
            eyebrow="Sugestão de preço"
            headline={
              <>
                Ancorada no
                <br />
                mercado real
              </>
            }
            accent={colors.success}
          />
        }
        visual={<PriceSuggestionMock />}
      />
    ),
  },
  {
    durationInFrames: 170,
    content: (
      <EndCard
        headline={
          <>
            Menos tempo a escrever.
            <br />
            Mais tempo a vender.
          </>
        }
      />
    ),
  },
];

/** Reel 05 — AI-assisted listings: generated description + price suggestion. */
export const AiListingReel: React.FC = () => (
  <Reel scenes={aiListingScenes} musicOffsetSeconds={7} />
);
