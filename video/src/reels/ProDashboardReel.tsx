import React from "react";
import { useCurrentFrame } from "remotion";
import {
  Eye,
  ChatCircleDots,
  Heart,
  ChartLineUp,
  WarningCircle,
} from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { Locale } from "../copy";
import { fadeUp, popIn, countUp, easeProgress, formatThousands } from "../anim";

const COPY = {
  pt: {
    kicker: "Para stands e oficinas",
    hookLines: [
      "Quantas pessoas",
      <React.Fragment key="l2">
        viram o teu <Accent>stock</Accent>
      </React.Fragment>,
      "esta semana?",
    ],
    kpis: {
      views: "Visualizações",
      contacts: "Contactos",
      favorites: "Favoritos",
      contactRate: "Taxa de contacto",
    },
    chartTitle: "Últimos 7 dias",
    overviewEyebrow: "Painel Profissional",
    overviewHeadline: (
      <>
        Os teus números,
        <br />
        em tempo real
      </>
    ),
    listingStats: (views: number, contacts: number) =>
      `${views} visualizações · ${contacts} contactos`,
    noContacts: "Sem contactos",
    signalsEyebrow: "Sinais inteligentes",
    signalsHeadline: (
      <>
        Vê o que precisa
        <br />
        de atenção
      </>
    ),
    endHeadline: (
      <>
        Gere o teu negócio
        <br />
        com dados.
      </>
    ),
    thousands: "\u2009",
  },
  br: {
    kicker: "Para lojistas e oficinas",
    hookLines: [
      "Quantas pessoas",
      <React.Fragment key="l2">
        viram seu <Accent>estoque</Accent>
      </React.Fragment>,
      "esta semana?",
    ],
    kpis: {
      views: "Visualizações",
      contacts: "Contatos",
      favorites: "Favoritos",
      contactRate: "Taxa de contato",
    },
    chartTitle: "Últimos 7 dias",
    overviewEyebrow: "Painel Profissional",
    overviewHeadline: (
      <>
        Seus números,
        <br />
        em tempo real
      </>
    ),
    listingStats: (views: number, contacts: number) =>
      `${views} visualizações · ${contacts} contatos`,
    noContacts: "Sem contatos",
    signalsEyebrow: "Sinais inteligentes",
    signalsHeadline: (
      <>
        Veja o que precisa
        <br />
        de atenção
      </>
    ),
    endHeadline: (
      <>
        Gerencie seu negócio
        <br />
        com dados.
      </>
    ),
    thousands: ".",
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** KPI grid + animated line chart, echoing the /painel overview. */
const DashboardMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const chartEnter = fadeUp(frame, 70, 50);
  const draw = easeProgress(frame, 84, 55);

  const kpis = [
    { Icon: Eye, label: c.kpis.views, value: 1284, suffix: "", delta: "+18%", color: colors.primary },
    { Icon: ChatCircleDots, label: c.kpis.contacts, value: 96, suffix: "", delta: "+12%", color: colors.secondary },
    { Icon: Heart, label: c.kpis.favorites, value: 210, suffix: "", delta: "+9%", color: colors.success },
    { Icon: ChartLineUp, label: c.kpis.contactRate, value: 7, suffix: ",5%", delta: "+2%", color: colors.primaryDark },
  ] as const;

  // Weekly views trend for the SVG line (x evenly spaced, y in chart space).
  const points = [150, 132, 138, 110, 96, 74, 42];
  const w = 640;
  const h = 190;
  const path = points
    .map((y, i) => `${(i * w) / (points.length - 1)},${y}`)
    .join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 800 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {kpis.map((kpi, i) => {
          const enter = fadeUp(frame, 12 + i * 12, 50);
          const scale = popIn(frame, 12 + i * 12);
          const value = countUp(frame, 20 + i * 12, kpi.value);
          return (
            <UiCard
              key={kpi.label}
              width="100%"
              style={{
                opacity: enter.opacity,
                translate: enter.translate,
                scale: String(scale),
                padding: "30px 34px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <kpi.Icon size={44} weight="bold" color={kpi.color} />
                <span style={{ fontWeight: 600, fontSize: 30, color: "#6c6e72" }}>
                  {kpi.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 62, color: colors.ink }}>
                  {formatThousands(value, c.thousands)}
                  {kpi.suffix}
                </span>
                <span style={{ fontWeight: 700, fontSize: 30, color: colors.success }}>
                  {kpi.delta}
                </span>
              </div>
            </UiCard>
          );
        })}
      </div>

      <UiCard
        width="100%"
        style={{
          opacity: chartEnter.opacity,
          translate: chartEnter.translate,
          padding: "30px 40px 24px",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 30, color: colors.ink, marginBottom: 10 }}>
          {c.chartTitle}
        </div>
        <svg width={w} height={h} style={{ display: "block" }}>
          <polyline
            points={path}
            fill="none"
            stroke={colors.primary}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1000}
            strokeDashoffset={1000 - draw * 1000}
          />
          <circle
            cx={w}
            cy={points[points.length - 1]}
            r={16}
            fill={colors.secondary}
            opacity={draw > 0.98 ? 1 : 0}
          />
        </svg>
      </UiCard>
    </div>
  );
};

const LISTINGS = [
  { name: "Renault Clio 1.5 dCi", views: 342, contacts: 21, alert: false },
  { name: "Peugeot 308 SW", views: 289, contacts: 14, alert: false },
  { name: "Opel Corsa 1.2", views: 118, contacts: 0, alert: true },
] as const;

/** Per-listing performance rows with the "no contacts" attention signal. */
const ListingSignalsMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: 820 }}>
      {LISTINGS.map((l, i) => {
        const enter = fadeUp(frame, 16 + i * 16, 50);
        const scale = popIn(frame, 16 + i * 16);
        const badge = popIn(frame, 78);
        const badgeOpacity = easeProgress(frame, 78, 14);
        return (
          <UiCard
            key={l.name}
            width="100%"
            style={{
              opacity: enter.opacity,
              translate: enter.translate,
              scale: String(scale),
              padding: "30px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 36, color: colors.ink }}>
                {l.name}
              </span>
              <span style={{ fontWeight: 600, fontSize: 28, color: "#6c6e72" }}>
                {c.listingStats(l.views, l.contacts)}
              </span>
            </div>
            {l.alert ? (
              <div
                style={{
                  opacity: badgeOpacity,
                  scale: String(badge),
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: `${colors.secondary}1f`,
                  color: colors.secondaryDark,
                  fontWeight: 800,
                  fontSize: 28,
                  padding: "14px 24px",
                  borderRadius: 999,
                  flexShrink: 0,
                }}
              >
                <WarningCircle size={34} weight="bold" />
                {c.noContacts}
              </div>
            ) : (
              <ChartLineUp size={44} weight="bold" color={colors.success} style={{ flexShrink: 0 }} />
            )}
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
      durationInFrames: 210,
      content: (
        <SceneShell
          tint="blue"
          heading={
            <SceneHeading eyebrow={c.overviewEyebrow} headline={c.overviewHeadline} />
          }
          visual={<DashboardMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 190,
      content: (
        <SceneShell
          tint="orange"
          heading={
            <SceneHeading eyebrow={c.signalsEyebrow} headline={c.signalsHeadline} />
          }
          visual={<ListingSignalsMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const proDashboardScenes = makeScenes("pt");
export const proDashboardScenesBR = makeScenes("br");

/** Reel 01 — professional dashboard analytics (stands & workshops). */
export const ProDashboardReel: React.FC = () => (
  <Reel scenes={proDashboardScenes} musicOffsetSeconds={7} />
);

/** Reel 01 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const ProDashboardReelBR: React.FC = () => (
  <Reel scenes={proDashboardScenesBR} musicOffsetSeconds={7} />
);
