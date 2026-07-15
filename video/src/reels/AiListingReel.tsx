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
import { Locale } from "../copy";
import { fadeUp, popIn, typeText, countUp, formatThousands } from "../anim";

const COPY = {
  pt: {
    kicker: "Para stands",
    hookLines: [
      "Anuncia um carro",
      <React.Fragment key="l2">
        em <Accent>60 segundos.</Accent>
      </React.Fragment>,
    ],
    description:
      "BMW Série 3 em excelente estado, revisões na marca e pneus novos. Interior impecável, ideal para quem procura conforto e fiabilidade.",
    generate: "Gerar com IA",
    generatedBadge: "Gerada com IA — edita à vontade",
    descriptionEyebrow: "Anúncios com IA",
    descriptionHeadline: (
      <>
        A descrição
        <br />
        escreve-se sozinha
      </>
    ),
    tiers: [
      { label: "Mínimo", value: 11900, highlight: false },
      { label: "Recomendado", value: 13400, highlight: true },
      { label: "Máximo", value: 14800, highlight: false },
    ],
    currency: (v: string) => `${v} €`,
    thousands: "\u2009",
    usePrice: "Usar este preço",
    priceNote: "Baseado em anúncios reais comparáveis",
    priceEyebrow: "Sugestão de preço",
    priceHeadline: (
      <>
        Ancorada no
        <br />
        mercado real
      </>
    ),
    endHeadline: (
      <>
        Menos tempo a escrever.
        <br />
        Mais tempo a vender.
      </>
    ),
  },
  br: {
    kicker: "Para lojistas",
    hookLines: [
      "Anuncie um carro",
      <React.Fragment key="l2">
        em <Accent>60 segundos.</Accent>
      </React.Fragment>,
    ],
    description:
      "BMW Série 3 em excelente estado, revisões na concessionária e pneus novos. Interior impecável, ideal para quem busca conforto e confiabilidade.",
    generate: "Gerar com IA",
    generatedBadge: "Gerada com IA — edite à vontade",
    descriptionEyebrow: "Anúncios com IA",
    descriptionHeadline: (
      <>
        A descrição
        <br />
        se escreve sozinha
      </>
    ),
    tiers: [
      { label: "Mínimo", value: 78900, highlight: false },
      { label: "Recomendado", value: 84500, highlight: true },
      { label: "Máximo", value: 89900, highlight: false },
    ],
    currency: (v: string) => `R$ ${v}`,
    thousands: ".",
    usePrice: "Usar este preço",
    priceNote: "Baseado em anúncios reais comparáveis",
    priceEyebrow: "Sugestão de preço",
    priceHeadline: (
      <>
        Ancorada no
        <br />
        mercado real
      </>
    ),
    endHeadline: (
      <>
        Menos tempo escrevendo.
        <br />
        Mais tempo vendendo.
      </>
    ),
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** Listing form: photo + "Gerar com IA" button + typewriter description. */
const AiDescriptionMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const card = fadeUp(frame, 10, 55);
  const cardScale = popIn(frame, 10);
  // Button "press": quick pulse down and back around frame 50.
  const press = interpolate(frame, [46, 52, 58], [1, 0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const typed = typeText(frame, 64, c.description, 1.6);
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
          {c.generate}
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
          <span style={{ opacity: frame % 20 < 10 && typed.length < c.description.length ? 1 : 0 }}>
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
          {c.generatedBadge}
        </div>
      </div>
    </UiCard>
  );
};

/** Price suggestion widget anchored on real market medians. */
const PriceSuggestionMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const cta = fadeUp(frame, 96, 40);
  const ctaScale = popIn(frame, 96);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <div style={{ display: "flex", gap: 22 }}>
        {c.tiers.map((tier, i) => {
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
                  fontSize: tier.highlight ? 50 : 40,
                  color: colors.ink,
                }}
              >
                {c.currency(formatThousands(value, c.thousands))}
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
        {c.usePrice}
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
        {c.priceNote}
      </div>
    </div>
  );
};

const makeScenes = (locale: Locale): ReelScene[] => {
  const c = COPY[locale];
  return [
    {
      durationInFrames: 100,
      content: <HookScene kicker={c.kicker} tint="orange" lines={[...c.hookLines]} />,
    },
    {
      durationInFrames: 230,
      content: (
        <SceneShell
          tint="orange"
          heading={
            <SceneHeading eyebrow={c.descriptionEyebrow} headline={c.descriptionHeadline} />
          }
          visual={<AiDescriptionMock c={c} />}
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
              eyebrow={c.priceEyebrow}
              headline={c.priceHeadline}
              accent={colors.success}
            />
          }
          visual={<PriceSuggestionMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const aiListingScenes = makeScenes("pt");
export const aiListingScenesBR = makeScenes("br");

/** Reel 05 — AI-assisted listings: generated description + price suggestion. */
export const AiListingReel: React.FC = () => (
  <Reel scenes={aiListingScenes} musicOffsetSeconds={7} />
);

/** Reel 05 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const AiListingReelBR: React.FC = () => (
  <Reel scenes={aiListingScenesBR} musicOffsetSeconds={7} />
);
