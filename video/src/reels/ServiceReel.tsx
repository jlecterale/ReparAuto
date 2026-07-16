import React from "react";
import { useCurrentFrame } from "remotion";
import {
  Wrench,
  CheckCircle,
  WhatsappLogo,
  MapPin,
  ListPlus,
  Briefcase,
} from "@phosphor-icons/react";
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
    kicker: "PRESTAÇÃO DE SERVIÇOS",
    hookLines: [
      "Como atrair",
      "mais clientes",
      <Accent key="l3">para a tua oficina</Accent>,
    ],
    step1Eyebrow: "PASSO 1: CADASTRO",
    step1Headline: (
      <>
        Seleciona as tuas
        <br />
        especialidades
      </>
    ),
    services: [
      "Mecânica Geral",
      "Revisão de Travões",
      "Diagnóstico Eletrónico",
    ],
    step2Eyebrow: "PASSO 2: VISIBILIDADE",
    step2Headline: (
      <>
        Clientes na tua
        <br />
        zona encontram-te
      </>
    ),
    mapLabel: "A tua Oficina",
    step3Eyebrow: "PASSO 3: NEGÓCIO DIRETO",
    step3Headline: (
      <>
        Recebe orçamentos
        <br />
        direto no WhatsApp
      </>
    ),
    quoteLabel: "Pedido de Orçamento",
    quoteService: "Revisão Geral + Travões",
    quoteButton: "Responder no WhatsApp",
    endHeadline: (
      <>
        Aumenta a faturação da tua oficina.
        <br />
        Cria o teu perfil grátis.
      </>
    ),
    endCta: "Cadastrar a minha Oficina",
  },
  br: {
    kicker: "PRESTAÇÃO DE SERVIÇOS",
    hookLines: [
      "Como atrair",
      "mais clientes",
      <Accent key="l3">para sua oficina</Accent>,
    ],
    step1Eyebrow: "PASSO 1: CADASTRO",
    step1Headline: (
      <>
        Selecione suas
        <br />
        especialidades
      </>
    ),
    services: [
      "Mecânica Geral",
      "Revisão de Freios",
      "Injeção Eletrônica",
    ],
    step2Eyebrow: "PASSO 2: VISIBILIDADE",
    step2Headline: (
      <>
        Clientes na sua
        <br />
        região te encontram
      </>
    ),
    mapLabel: "Sua Oficina",
    step3Eyebrow: "PASSO 3: NEGÓCIO DIRETO",
    step3Headline: (
      <>
        Receba orçamentos
        <br />
        direto no WhatsApp
      </>
    ),
    quoteLabel: "Pedido de Orçamento",
    quoteService: "Revisão Geral + Freios",
    quoteButton: "Responder no WhatsApp",
    endHeadline: (
      <>
        Aumente o faturamento da sua oficina.
        <br />
        Crie seu perfil grátis.
      </>
    ),
    endCta: "Cadastrar minha Oficina",
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** Step 1: Checklist of services/specialties popping in and checking off */
const ServiceSelectionMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 800 }}>
      {c.services.map((service, i) => {
        const itemEnter = fadeUp(frame, 10 + i * 15, 50);
        const itemScale = popIn(frame, 10 + i * 15);
        const isChecked = frame > 35 + i * 15;
        const checkScale = popIn(frame, 35 + i * 15);

        return (
          <UiCard
            key={service}
            style={{
              padding: "32px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: itemEnter.opacity,
              translate: itemEnter.translate,
              scale: String(itemScale),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 15,
                  background: `${colors.primary}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wrench size={36} weight="fill" color={colors.primary} />
              </div>
              <span style={{ fontSize: 32, fontWeight: 700, color: colors.ink }}>
                {service}
              </span>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `3px solid ${isChecked ? colors.success : "#cbd5e1"}`,
                background: isChecked ? colors.success : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scale: isChecked ? String(checkScale) : "1",
              }}
            >
              {isChecked && <CheckCircle size={32} weight="fill" color={colors.white} />}
            </div>
          </UiCard>
        );
      })}
    </div>
  );
};

/** Step 2: Live map pinpointing driver requests around your workshop */
const ClientsMapMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const enter = fadeUp(frame, 10, 50);
  const scale = popIn(frame, 10);
  const pulse = easeProgress(frame, 50, 60);

  const PINS = [
    { left: 180, top: 110 },
    { left: 600, top: 160 },
    { left: 220, top: 380 },
  ] as const;

  return (
    <UiCard
      width={800}
      style={{
        opacity: enter.opacity,
        translate: enter.translate,
        scale: String(scale),
        height: 560,
        position: "relative",
        background: "#f1f5f9",
      }}
    >
      <svg width={800} height={560} style={{ position: "absolute", inset: 0 }}>
        {[100, 240, 380, 500].map((y) => (
          <line key={`h-${y}`} x1={0} y1={y} x2={800} y2={y} stroke="#ffffff" strokeWidth={24} />
        ))}
        {[160, 420, 640].map((x) => (
          <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={560} stroke="#ffffff" strokeWidth={28} />
        ))}
      </svg>

      {/* Radar pulse around workshop */}
      <div
        style={{
          position: "absolute",
          left: 400 - 200 * pulse,
          top: 280 - 200 * pulse,
          width: 400 * pulse,
          height: 400 * pulse,
          borderRadius: "50%",
          border: `4px solid ${colors.secondary}66`,
          background: `${colors.secondary}0d`,
        }}
      />

      {/* Workshop central pin */}
      <div
        style={{
          position: "absolute",
          left: 400 - 50,
          top: 280 - 100,
          scale: String(popIn(frame, 20)),
          opacity: easeProgress(frame, 20, 10),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: colors.secondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 16px 36px rgba(0,0,0,0.3)",
          }}
        >
          <Briefcase size={54} weight="fill" color={colors.white} />
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: brandFont,
            fontWeight: 800,
            fontSize: 26,
            color: colors.ink,
            background: colors.white,
            padding: "8px 18px",
            borderRadius: 999,
            boxShadow: "0 10px 24px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
          }}
        >
          {c.mapLabel}
        </div>
      </div>

      {/* Local demand pins */}
      {PINS.map((pin, i) => {
        const pinPop = popIn(frame, 55 + i * 15);
        const pinOpacity = easeProgress(frame, 55 + i * 15, 10);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pin.left,
              top: pin.top,
              scale: String(pinPop),
              opacity: pinOpacity,
            }}
          >
            <MapPin size={64} weight="fill" color={colors.primary} />
          </div>
        );
      })}
    </UiCard>
  );
};

/** Step 3: Incoming quote request card with quick response via WhatsApp button */
const QuoteMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const cardEnter = fadeUp(frame, 10, 50);
  const cardScale = popIn(frame, 10);
  const btnEnter = fadeUp(frame, 45, 30);
  const btnScale = popIn(frame, 45);

  return (
    <UiCard
      width={760}
      style={{
        opacity: cardEnter.opacity,
        translate: cardEnter.translate,
        scale: String(cardScale),
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: `${colors.primary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ListPlus size={40} weight="fill" color={colors.primary} />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: colors.ink }}>
              {c.quoteLabel}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#64748b", marginTop: 2 }}>
              Há 2 min • São Paulo, SP
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          border: "2px dashed #e2e8f0",
          borderRadius: 20,
          padding: "24px",
          background: "#f8fafc",
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, color: colors.ink }}>
          {c.quoteService}
        </div>
        <div style={{ fontSize: 20, color: "#475569", marginTop: 8 }}>
          "Gostaria de agendar uma revisão e verificar um ruído no freio dianteiro."
        </div>
      </div>

      <div
        style={{
          opacity: btnEnter.opacity,
          translate: btnEnter.translate,
          scale: String(btnScale),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#25D366",
          color: colors.white,
          fontWeight: 800,
          fontSize: 32,
          padding: "22px 36px",
          borderRadius: 20,
          boxShadow: "0 12px 28px rgba(37, 211, 102, 0.3)",
          cursor: "pointer",
        }}
      >
        <WhatsappLogo size={44} weight="fill" />
        {c.quoteButton}
      </div>
    </UiCard>
  );
};

const makeScenes = (locale: Locale): ReelScene[] => {
  const c = COPY[locale];
  return [
    {
      durationInFrames: 110,
      content: (
        <HookScene kicker={c.kicker} lines={[...c.hookLines]} fontSize={84} tint="blue" />
      ),
    },
    {
      durationInFrames: 190,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.step1Eyebrow} headline={c.step1Headline} />}
          visual={<ServiceSelectionMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 195,
      content: (
        <SceneShell
          tint="orange"
          heading={<SceneHeading eyebrow={c.step2Eyebrow} headline={c.step2Headline} />}
          visual={<ClientsMapMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 195,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.step3Eyebrow} headline={c.step3Headline} />}
          visual={<QuoteMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 180,
      content: <EndCard headline={c.endHeadline} cta={c.endCta} locale={locale} />,
    },
  ];
};

export const serviceScenes = makeScenes("pt");
export const serviceScenesBR = makeScenes("br");

export const ServiceReel: React.FC = () => (
  <Reel scenes={serviceScenes} musicOffsetSeconds={2} />
);

export const ServiceReelBR: React.FC = () => (
  <Reel scenes={serviceScenesBR} musicOffsetSeconds={2} />
);
