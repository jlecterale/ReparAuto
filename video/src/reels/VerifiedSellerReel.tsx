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
import { Locale } from "../copy";
import { fadeUp, popIn } from "../anim";

const COPY = {
  pt: {
    kicker: "Para stands",
    hookLines: [
      "Porque é que",
      "uns anúncios",
      <Accent key="l3">vendem primeiro?</Accent>,
    ],
    sellerName: "Stand Silva Automóveis",
    sellerListings: "34 anúncios ativos",
    verified: "Verificado",
    pills: ["NIF confirmado", "Selo em todos os anúncios"],
    sealEyebrow: "Vendedor Verificado",
    sealHeadline: (
      <>
        O selo que
        <br />
        gera confiança
      </>
    ),
    results: [
      { name: "Renault Mégane 1.5", seller: "Anúncio particular", verified: false, slotFrom: 0, slotTo: 1 },
      { name: "Seat Leon 2.0 TDI", seller: "Anúncio particular", verified: false, slotFrom: 1, slotTo: 2 },
      { name: "Peugeot 308 1.2 PureTech", seller: "Stand Silva · Verificado", verified: true, slotFrom: 2, slotTo: 0 },
    ],
    firstPlace: "1.º lugar",
    rankEyebrow: "Prioridade nos resultados",
    rankHeadline: (
      <>
        Apareces primeiro
        <br />a quem procura
      </>
    ),
    endHeadline: (
      <>
        Confiança vende.
        <br />
        Verifica o teu stand.
      </>
    ),
  },
  br: {
    kicker: "Para lojistas",
    hookLines: [
      "Por que uns",
      "anúncios",
      <Accent key="l3">vendem primeiro?</Accent>,
    ],
    sellerName: "Silva Veículos",
    sellerListings: "34 anúncios ativos",
    verified: "Verificado",
    pills: ["CNPJ confirmado", "Selo em todos os anúncios"],
    sealEyebrow: "Vendedor Verificado",
    sealHeadline: (
      <>
        O selo que
        <br />
        gera confiança
      </>
    ),
    results: [
      { name: "Chevrolet Onix 1.0", seller: "Anúncio particular", verified: false, slotFrom: 0, slotTo: 1 },
      { name: "Fiat Argo Drive 1.3", seller: "Anúncio particular", verified: false, slotFrom: 1, slotTo: 2 },
      { name: "VW Polo TSI", seller: "Silva Veículos · Verificado", verified: true, slotFrom: 2, slotTo: 0 },
    ],
    firstPlace: "1º lugar",
    rankEyebrow: "Prioridade nos resultados",
    rankHeadline: (
      <>
        Apareça primeiro
        <br />
        para quem procura
      </>
    ),
    endHeadline: (
      <>
        Confiança vende.
        <br />
        Verifique sua loja.
      </>
    ),
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** Seller card receiving the blue "Verificado" seal. */
const SealMock: React.FC<{ c: Copy }> = ({ c }) => {
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
            {c.sellerName}
          </span>
          <span style={{ fontWeight: 600, fontSize: 30, color: "#6c6e72" }}>
            {c.sellerListings}
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
          {c.verified}
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
        {c.pills.map((label) => (
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

const ROW_HEIGHT = 150;
const ROW_GAP = 26;

/** Search results reordering: the verified listing climbs to the top. */
const RankingMock: React.FC<{ c: Copy }> = ({ c }) => {
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
        height: c.results.length * ROW_HEIGHT + (c.results.length - 1) * ROW_GAP,
      }}
    >
      {c.results.map((r, i) => {
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
                {c.firstPlace}
              </div>
            ) : null}
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
      content: <HookScene kicker={c.kicker} lines={[...c.hookLines]} />,
    },
    {
      durationInFrames: 200,
      content: (
        <SceneShell
          tint="blue"
          heading={
            <SceneHeading
              eyebrow={c.sealEyebrow}
              headline={c.sealHeadline}
              accent={colors.primary}
            />
          }
          visual={<SealMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 190,
      content: (
        <SceneShell
          tint="orange"
          heading={<SceneHeading eyebrow={c.rankEyebrow} headline={c.rankHeadline} />}
          visual={<RankingMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const verifiedSellerScenes = makeScenes("pt");
export const verifiedSellerScenesBR = makeScenes("br");

/** Reel 04 — verified seller badge + ranking priority for dealerships. */
export const VerifiedSellerReel: React.FC = () => (
  <Reel scenes={verifiedSellerScenes} musicOffsetSeconds={10} />
);

/** Reel 04 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const VerifiedSellerReelBR: React.FC = () => (
  <Reel scenes={verifiedSellerScenesBR} musicOffsetSeconds={10} />
);
