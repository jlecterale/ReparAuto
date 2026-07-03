import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { Tag, TrendUp } from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn, easeProgress, countUp, formatThousands } from "../anim";

const LEVELS = [
  { label: "Excelente", color: "#0e9f6e" },
  { label: "Bom preço", color: colors.success },
  { label: "Justo", color: "#f2b91d" },
  { label: "Acima", color: colors.secondary },
  { label: "Sobrevalorizado", color: "#e0452b" },
] as const;

/** 5-level price badge scale with the marker settling on "Bom preço". */
const PriceScaleMock: React.FC = () => {
  const frame = useCurrentFrame();
  const scaleEnter = fadeUp(frame, 12, 50);
  // Marker sweeps across the scale and settles on segment 2 ("Bom preço").
  const marker = interpolate(frame, [40, 90], [0.5, 1.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.2, 0.64, 1),
  });
  const verdict = fadeUp(frame, 100, 45);
  const verdictScale = popIn(frame, 100);

  const SEGMENT = 150;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      <div
        style={{
          opacity: scaleEnter.opacity,
          translate: scaleEnter.translate,
          position: "relative",
          paddingTop: 56,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {LEVELS.map((level) => (
            <div key={level.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: SEGMENT,
                  height: 34,
                  borderRadius: 999,
                  background: level.color,
                }}
              />
              <span
                style={{
                  fontFamily: brandFont,
                  fontWeight: 700,
                  fontSize: 24,
                  color: colors.mist,
                  textAlign: "center",
                  maxWidth: SEGMENT,
                }}
              >
                {level.label}
              </span>
            </div>
          ))}
        </div>
        {/* Marker triangle above the scale */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: marker * (SEGMENT + 8) - 26,
            width: 0,
            height: 0,
            borderLeft: "26px solid transparent",
            borderRight: "26px solid transparent",
            borderTop: `40px solid ${colors.white}`,
          }}
        />
      </div>

      <UiCard
        width={720}
        style={{
          opacity: verdict.opacity,
          translate: verdict.translate,
          scale: String(verdictScale),
          padding: "36px 42px",
          display: "flex",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 28,
            background: `${colors.success}1f`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Tag size={56} weight="bold" color={colors.success} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 40, color: colors.success }}>
            Bom preço
          </span>
          <span style={{ fontWeight: 600, fontSize: 30, color: "#6c6e72" }}>
            850 € abaixo da mediana de anúncios semelhantes
          </span>
        </div>
      </UiCard>
    </div>
  );
};

const BARS = [26, 44, 78, 120, 156, 128, 88, 52, 30];

/** Market page: median KPI + distribution histogram growing in. */
const MarketMock: React.FC = () => {
  const frame = useCurrentFrame();
  const kpi = fadeUp(frame, 12, 50);
  const kpiScale = popIn(frame, 12);
  const median = countUp(frame, 20, 13900, 50);
  const chart = fadeUp(frame, 46, 50);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <UiCard
        width={780}
        style={{
          opacity: kpi.opacity,
          translate: kpi.translate,
          scale: String(kpiScale),
          padding: "34px 42px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 30, color: "#6c6e72" }}>
            Mediana do mercado
          </span>
          <span style={{ fontWeight: 800, fontSize: 64, color: colors.ink }}>
            {formatThousands(median)} €
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: `${colors.primary}1f`,
            color: colors.primary,
            fontWeight: 800,
            fontSize: 28,
            padding: "14px 26px",
            borderRadius: 999,
          }}
        >
          <TrendUp size={36} weight="bold" />
          P25–P75
        </div>
      </UiCard>

      <UiCard
        width={780}
        style={{
          opacity: chart.opacity,
          translate: chart.translate,
          padding: "36px 42px 30px",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 30, color: colors.ink, marginBottom: 20 }}>
          Distribuição de preços — Clio 2018+
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 170 }}>
          {BARS.map((height, i) => {
            const grow = easeProgress(frame, 56 + i * 5, 30);
            const isPeak = i === 4;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: height * grow,
                  borderRadius: 10,
                  background: isPeak ? colors.secondary : `${colors.primary}cc`,
                }}
              />
            );
          })}
        </div>
      </UiCard>
    </div>
  );
};

export const pricingScenes: ReelScene[] = [
  {
    durationInFrames: 100,
    content: (
      <HookScene
        kicker="Para stands"
        lines={[
          "O teu stock está",
          <>
            ao <Accent>preço certo?</Accent>
          </>,
        ]}
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
            eyebrow="Badge de preço"
            headline={
              <>
                5 níveis,
                <br />
                dados reais
              </>
            }
            accent={colors.success}
          />
        }
        visual={<PriceScaleMock />}
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
            eyebrow="Página de mercado"
            headline={
              <>
                O mercado inteiro,
                <br />
                num relance
              </>
            }
          />
        }
        visual={<MarketMock />}
      />
    ),
  },
  {
    durationInFrames: 170,
    content: (
      <EndCard
        headline={
          <>
            Preço certo vende
            <br />
            mais depressa.
          </>
        }
      />
    ),
  },
];

/** Reel 06 — price intelligence: 5-level badges + market page. */
export const PricingReel: React.FC = () => (
  <Reel scenes={pricingScenes} musicOffsetSeconds={0} />
);
