import React from "react";
import { useCurrentFrame } from "remotion";
import { MagnifyingGlass, CheckCircle, Truck } from "@phosphor-icons/react";
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
    kicker: "Para oficinas",
    hookLines: [
      "O carro no elevador.",
      <React.Fragment key="l2">
        A peça <Accent>a semanas?</Accent>
      </React.Fragment>,
    ],
    query: "Alternador · Renault Clio IV",
    results: [
      { name: "Alternador Valeo", detail: "Clio IV 1.5 dCi · usado, testado", price: "85 €", place: "Braga" },
      { name: "Alternador (desmonte)", detail: "Clio IV · retirado a funcionar", price: "60 €", place: "Setúbal" },
    ],
    compatible: "Compatível",
    searchEyebrow: "Peças novas e usadas",
    searchHeadline: (
      <>
        Procura por carro,
        <br />
        não por sorte
      </>
    ),
    chat: [
      { mine: true, text: "Serve no 1.5 dCi de 2014?", delay: 16 },
      { mine: false, text: "Serve sim, a referência confere. 👍", delay: 58 },
      { mine: false, text: "Se confirmares até às 16h, envio hoje.", delay: 96 },
    ],
    shipping: "Vendedores de todo o país",
    chatEyebrow: "Fala com quem vende",
    chatHeadline: (
      <>
        Confirma antes
        <br />
        de comprar
      </>
    ),
    endHeadline: (
      <>
        O carro sai do
        <br />
        elevador mais cedo.
      </>
    ),
  },
  br: {
    kicker: "Para oficinas",
    hookLines: [
      "O carro no elevador.",
      <React.Fragment key="l2">
        E a peça ainda <Accent>nem chegou?</Accent>
      </React.Fragment>,
    ],
    query: "Alternador · Chevrolet Onix",
    results: [
      { name: "Alternador Valeo", detail: "Onix 1.0 turbo · usado, testado", price: "R$ 450", place: "Campinas" },
      { name: "Alternador (desmanche)", detail: "Onix · retirado funcionando", price: "R$ 320", place: "Sorocaba" },
    ],
    compatible: "Compatível",
    searchEyebrow: "Peças novas e usadas",
    searchHeadline: (
      <>
        Busque por carro,
        <br />
        não por sorte
      </>
    ),
    chat: [
      { mine: true, text: "Serve no 1.0 turbo 2020?", delay: 16 },
      { mine: false, text: "Serve sim, o código confere. 👍", delay: 58 },
      { mine: false, text: "Confirmando até as 16h, envio hoje.", delay: 96 },
    ],
    shipping: "Vendedores do país inteiro",
    chatEyebrow: "Fale com quem vende",
    chatHeadline: (
      <>
        Confirme antes
        <br />
        de comprar
      </>
    ),
    endHeadline: (
      <>
        O carro sai do
        <br />
        elevador mais cedo.
      </>
    ),
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** Compatibility-first parts search: query + matching results. */
const PartsSearchMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const search = fadeUp(frame, 10, 45);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 820 }}>
      <UiCard
        width="100%"
        style={{
          opacity: search.opacity,
          translate: search.translate,
          padding: "28px 34px",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <MagnifyingGlass size={44} weight="bold" color={colors.primary} />
        <span style={{ fontWeight: 700, fontSize: 36, color: colors.ink }}>
          {c.query}
        </span>
      </UiCard>

      {c.results.map((r, i) => {
        const enter = fadeUp(frame, 34 + i * 20, 55);
        const scale = popIn(frame, 34 + i * 20);
        const chip = popIn(frame, 56 + i * 20);
        return (
          <UiCard
            key={r.name}
            width="100%"
            style={{
              opacity: enter.opacity,
              translate: enter.translate,
              scale: String(scale),
              padding: "30px 36px",
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 36, color: colors.ink }}>
                {r.name}
              </span>
              <span style={{ fontWeight: 600, fontSize: 28, color: "#6c6e72" }}>
                {r.detail} · {r.place}
              </span>
              <div
                style={{
                  scale: String(chip),
                  alignSelf: "flex-start",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: `${colors.success}1f`,
                  color: colors.success,
                  fontWeight: 800,
                  fontSize: 26,
                  padding: "8px 20px",
                  borderRadius: 999,
                }}
              >
                <CheckCircle size={30} weight="fill" />
                {c.compatible}
              </div>
            </div>
            <div
              style={{
                background: colors.primary,
                color: colors.white,
                fontWeight: 800,
                fontSize: 36,
                padding: "16px 30px",
                borderRadius: 999,
                flexShrink: 0,
              }}
            >
              {r.price}
            </div>
          </UiCard>
        );
      })}
    </div>
  );
};

/** Quick confirmation chat with the dismantler + nationwide shipping pill. */
const ConfirmChatMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const shipping = fadeUp(frame, 130, 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 780 }}>
      {c.chat.map((m, i) => {
        const enter = fadeUp(frame, m.delay, 40);
        const scale = popIn(frame, m.delay);
        return (
          <div
            key={i}
            style={{
              alignSelf: m.mine ? "flex-end" : "flex-start",
              opacity: enter.opacity,
              translate: enter.translate,
              scale: String(scale),
              maxWidth: "80%",
              background: m.mine ? colors.primary : colors.white,
              color: m.mine ? colors.white : colors.ink,
              fontFamily: brandFont,
              fontWeight: 600,
              fontSize: 38,
              lineHeight: 1.3,
              padding: "28px 36px",
              borderRadius: 34,
              borderBottomRightRadius: m.mine ? 8 : 34,
              borderBottomLeftRadius: m.mine ? 34 : 8,
              boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
            }}
          >
            {m.text}
          </div>
        );
      })}

      <div
        style={{
          opacity: shipping.opacity,
          translate: shipping.translate,
          alignSelf: "center",
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
        <Truck size={40} weight="bold" color={colors.mist} />
        {c.shipping}
      </div>
    </div>
  );
};

const makeScenes = (locale: Locale): ReelScene[] => {
  const c = COPY[locale];
  return [
    {
      durationInFrames: 105,
      content: (
        <HookScene kicker={c.kicker} tint="orange" lines={[...c.hookLines]} fontSize={92} />
      ),
    },
    {
      durationInFrames: 210,
      content: (
        <SceneShell
          tint="orange"
          heading={
            <SceneHeading
              eyebrow={c.searchEyebrow}
              headline={c.searchHeadline}
              accent={colors.success}
            />
          }
          visual={<PartsSearchMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 200,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.chatEyebrow} headline={c.chatHeadline} />}
          visual={<ConfirmChatMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const partsFinderScenes = makeScenes("pt");
export const partsFinderScenesBR = makeScenes("br");

/** Reel 12 — workshops sourcing parts fast (search by car + confirm in chat). */
export const PartsFinderReel: React.FC = () => (
  <Reel scenes={partsFinderScenes} musicOffsetSeconds={7} />
);

/** Reel 12 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const PartsFinderReelBR: React.FC = () => (
  <Reel scenes={partsFinderScenesBR} musicOffsetSeconds={7} />
);
