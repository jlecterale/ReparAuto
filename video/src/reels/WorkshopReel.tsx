import React from "react";
import { useCurrentFrame } from "remotion";
import { MapPin, Star, Wrench, ChatCircleDots } from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { Locale } from "../copy";
import { fadeUp, popIn, easeProgress } from "../anim";

const PINS = [
  { left: 150, top: 120 },
  { left: 620, top: 140 },
  { left: 180, top: 400 },
] as const;

const COPY = {
  pt: {
    kicker: "Para oficinas",
    hookLines: [
      "Há condutores",
      "à tua procura",
      <Accent key="l3">agora mesmo.</Accent>,
    ],
    mapLabel: "A tua oficina",
    mapEyebrow: "Perto de ti",
    mapHeadline: (
      <>
        Aparece a quem
        <br />
        está na tua zona
      </>
    ),
    workshopName: "Oficina Central",
    rating: "4,9 · 132 avaliações",
    services: ["Travões", "Suspensão", "Revisões"],
    contact: "Pedir orçamento",
    profileEyebrow: "Reputação",
    profileHeadline: (
      <>
        Avaliações que
        <br />
        trabalham por ti
      </>
    ),
    endHeadline: (
      <>
        Regista a tua oficina.
        <br />É grátis.
      </>
    ),
    endCta: "Cria o perfil da tua oficina",
  },
  br: {
    kicker: "Para oficinas",
    hookLines: [
      "Tem motorista",
      "procurando você",
      <Accent key="l3">agora mesmo.</Accent>,
    ],
    mapLabel: "Sua oficina",
    mapEyebrow: "Perto de você",
    mapHeadline: (
      <>
        Apareça para
        <br />
        quem está perto
      </>
    ),
    workshopName: "Oficina Central",
    rating: "4,9 · 132 avaliações",
    services: ["Freios", "Suspensão", "Revisões"],
    contact: "Pedir orçamento",
    profileEyebrow: "Reputação",
    profileHeadline: (
      <>
        Avaliações que
        <br />
        trabalham por você
      </>
    ),
    endHeadline: (
      <>
        Cadastre sua oficina.
        <br />É grátis.
      </>
    ),
    endCta: "Crie o perfil da sua oficina",
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** Stylised map with driver pins popping around the workshop. */
const MapMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const enter = fadeUp(frame, 10, 50);
  const scale = popIn(frame, 10);
  const pulse = easeProgress(frame, 60, 60);

  return (
    <UiCard
      width={800}
      style={{
        opacity: enter.opacity,
        translate: enter.translate,
        scale: String(scale),
        height: 560,
        position: "relative",
        background: "#eaf1f9",
      }}
    >
      {/* Stylised street grid */}
      <svg width={800} height={560} style={{ position: "absolute", inset: 0 }}>
        {[90, 220, 350, 480].map((y) => (
          <line key={`h-${y}`} x1={0} y1={y} x2={800} y2={y} stroke="#ffffff" strokeWidth={22} />
        ))}
        {[140, 400, 660].map((x) => (
          <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={560} stroke="#ffffff" strokeWidth={26} />
        ))}
      </svg>

      {/* Radius pulse around the workshop */}
      <div
        style={{
          position: "absolute",
          left: 400 - 190 * pulse,
          top: 300 - 190 * pulse,
          width: 380 * pulse,
          height: 380 * pulse,
          borderRadius: "50%",
          border: `5px solid ${colors.primary}66`,
          background: `${colors.primary}14`,
        }}
      />

      {/* The workshop pin (center) */}
      <div
        style={{
          position: "absolute",
          left: 400 - 56,
          top: 300 - 120,
          scale: String(popIn(frame, 26)),
          opacity: easeProgress(frame, 26, 12),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: "50%",
            background: colors.secondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          }}
        >
          <Wrench size={60} weight="bold" color={colors.white} />
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: brandFont,
            fontWeight: 800,
            fontSize: 30,
            color: colors.ink,
            background: colors.white,
            padding: "10px 22px",
            borderRadius: 999,
            boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
          }}
        >
          {c.mapLabel}
        </div>
      </div>

      {/* Driver pins popping in around it */}
      {PINS.map((pin, i) => {
        const pop = popIn(frame, 66 + i * 14);
        const opacity = easeProgress(frame, 66 + i * 14, 12);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pin.left,
              top: pin.top,
              scale: String(pop),
              opacity,
            }}
          >
            <MapPin size={72} weight="fill" color={colors.primary} />
          </div>
        );
      })}
    </UiCard>
  );
};

/** Workshop profile card: stars, review count, services, contact button. */
const ProfileMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const enter = fadeUp(frame, 12, 55);
  const scale = popIn(frame, 12);
  const contact = fadeUp(frame, 96, 40);
  const contactScale = popIn(frame, 96);

  return (
    <UiCard
      width={760}
      style={{
        opacity: enter.opacity,
        translate: enter.translate,
        scale: String(scale),
        padding: "42px 44px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 30,
            background: `${colors.secondary}1f`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Wrench size={64} weight="bold" color={colors.secondary} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 44, color: colors.ink }}>
            {c.workshopName}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const starPop = popIn(frame, 36 + i * 8);
              const starOpacity = easeProgress(frame, 36 + i * 8, 10);
              return (
                <span key={i} style={{ scale: String(starPop), opacity: starOpacity, display: "flex" }}>
                  <Star size={40} weight="fill" color="#f2b91d" />
                </span>
              );
            })}
            <span style={{ fontWeight: 700, fontSize: 30, color: "#6c6e72", marginLeft: 10 }}>
              {c.rating}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {c.services.map((service, i) => {
          const chipEnter = fadeUp(frame, 60 + i * 10, 30);
          return (
            <div
              key={service}
              style={{
                opacity: chipEnter.opacity,
                translate: chipEnter.translate,
                background: `${colors.primary}14`,
                color: colors.primaryDark,
                fontWeight: 700,
                fontSize: 30,
                padding: "14px 28px",
                borderRadius: 999,
              }}
            >
              {service}
            </div>
          );
        })}
      </div>

      <div
        style={{
          opacity: contact.opacity,
          translate: contact.translate,
          scale: String(contactScale),
          alignSelf: "stretch",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: colors.primary,
          color: colors.white,
          fontWeight: 800,
          fontSize: 36,
          padding: "24px 40px",
          borderRadius: 22,
        }}
      >
        <ChatCircleDots size={44} weight="fill" />
        {c.contact}
      </div>
    </UiCard>
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
      durationInFrames: 200,
      content: (
        <SceneShell
          tint="orange"
          heading={<SceneHeading eyebrow={c.mapEyebrow} headline={c.mapHeadline} />}
          visual={<MapMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 200,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.profileEyebrow} headline={c.profileHeadline} />}
          visual={<ProfileMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} cta={c.endCta} locale={locale} />,
    },
  ];
};

export const workshopScenes = makeScenes("pt");
export const workshopScenesBR = makeScenes("br");

/** Reel 07 — workshop visibility: map presence + reviews/reputation. */
export const WorkshopReel: React.FC = () => (
  <Reel scenes={workshopScenes} musicOffsetSeconds={4} />
);

/** Reel 07 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const WorkshopReelBR: React.FC = () => (
  <Reel scenes={workshopScenesBR} musicOffsetSeconds={4} />
);
