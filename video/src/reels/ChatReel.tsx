import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Bell, LockSimple } from "@phosphor-icons/react";
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

const COPY = {
  pt: {
    kicker: "Para stands e oficinas",
    hookLines: [
      "O primeiro a responder",
      <Accent key="l2">ganha o negócio.</Accent>,
    ],
    messages: [
      { mine: false, text: "Boa tarde! O Clio ainda está disponível?", delay: 20 },
      { mine: true, text: "Está sim. Queres vir vê-lo amanhã?", delay: 66 },
      { mine: false, text: "Pode ser às 15h?", delay: 112 },
      { mine: true, text: "Combinado, fica reservado 👍", delay: 148 },
    ],
    chatEyebrow: "Chat integrado",
    chatHeadline: (
      <>
        Fala já com quem
        <br />
        quer comprar
      </>
    ),
    notifTitle: "Nova mensagem · agora",
    notifBody: "João pergunta sobre o Renault Clio",
    privacy: "Sem partilhar o teu número",
    notifEyebrow: "Notificações",
    notifHeadline: (
      <>
        Nenhum contacto
        <br />
        fica sem resposta
      </>
    ),
    endHeadline: (
      <>
        Responde rápido.
        <br />
        Fecha mais negócios.
      </>
    ),
  },
  br: {
    kicker: "Para lojistas e oficinas",
    hookLines: [
      "O primeiro a responder",
      <Accent key="l2">ganha o negócio.</Accent>,
    ],
    messages: [
      { mine: false, text: "Boa tarde! O Onix ainda está disponível?", delay: 20 },
      { mine: true, text: "Está sim. Quer vir ver amanhã?", delay: 66 },
      { mine: false, text: "Pode ser às 15h?", delay: 112 },
      { mine: true, text: "Combinado, fica reservado 👍", delay: 148 },
    ],
    chatEyebrow: "Chat integrado",
    chatHeadline: (
      <>
        Fale na hora com
        <br />
        quem quer comprar
      </>
    ),
    notifTitle: "Nova mensagem · agora",
    notifBody: "João pergunta sobre o Chevrolet Onix",
    privacy: "Sem compartilhar seu número",
    notifEyebrow: "Notificações",
    notifHeadline: (
      <>
        Nenhum contato
        <br />
        fica sem resposta
      </>
    ),
    endHeadline: (
      <>
        Responda rápido.
        <br />
        Feche mais negócios.
      </>
    ),
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** Chat conversation between buyer and seller, bubble by bubble. */
const ConversationMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 780 }}>
      {c.messages.map((m, i) => {
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
    </div>
  );
};

/** Push notification sliding in + privacy pill. */
const NotificationMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  // Notification slides down from above like a real push banner.
  const slide = interpolate(frame, [14, 40], [-160, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = easeProgress(frame, 14, 18);
  const ring = interpolate(frame, [40, 48, 56, 64], [0, -14, 10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const privacy = fadeUp(frame, 84, 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
      <UiCard
        width={780}
        style={{
          opacity,
          translate: `0px ${slide}px`,
          padding: "34px 38px",
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
            background: `${colors.secondary}1f`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            rotate: `${ring}deg`,
          }}
        >
          <Bell size={56} weight="fill" color={colors.secondary} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 36, color: colors.ink }}>
            {c.notifTitle}
          </span>
          <span style={{ fontWeight: 600, fontSize: 30, color: "#6c6e72" }}>
            {c.notifBody}
          </span>
        </div>
      </UiCard>

      <div
        style={{
          opacity: privacy.opacity,
          translate: privacy.translate,
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
        <LockSimple size={40} weight="bold" color={colors.mist} />
        {c.privacy}
      </div>
    </div>
  );
};

const makeScenes = (locale: Locale): ReelScene[] => {
  const c = COPY[locale];
  return [
    {
      durationInFrames: 100,
      content: (
        <HookScene kicker={c.kicker} lines={[...c.hookLines]} fontSize={92} />
      ),
    },
    {
      durationInFrames: 220,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.chatEyebrow} headline={c.chatHeadline} />}
          visual={<ConversationMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 180,
      content: (
        <SceneShell
          tint="orange"
          heading={<SceneHeading eyebrow={c.notifEyebrow} headline={c.notifHeadline} />}
          visual={<NotificationMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const chatScenes = makeScenes("pt");
export const chatScenesBR = makeScenes("br");

/** Reel 08 — integrated chat + push notifications for fast replies. */
export const ChatReel: React.FC = () => (
  <Reel scenes={chatScenes} musicOffsetSeconds={10} />
);

/** Reel 08 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const ChatReelBR: React.FC = () => (
  <Reel scenes={chatScenesBR} musicOffsetSeconds={10} />
);
