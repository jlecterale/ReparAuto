import React from "react";
import { useCurrentFrame } from "remotion";
import {
  GlobeHemisphereWest,
  Percent,
  Sparkle,
  Coins,
  CheckCircle,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { Locale } from "../copy";
import { fadeUp, popIn, countUp } from "../anim";

const COPY = {
  pt: {
    kicker: "RECARGARAGE BRASIL",
    hookLines: [
      "A plataforma de carros",
      <React.Fragment key="l2">
        mais <Accent>completa</Accent> da Europa
      </React.Fragment>,
      "chegou ao Brasil!",
    ],
    statsEyebrow: "SUCESSO EM PORTUGAL",
    statsHeadline: (
      <>
        Tudo o que você precisa,
        <br />
        reunido em um só lugar
      </>
    ),
    zeroEyebrow: "100% DIRETO",
    zeroHeadline: (
      <>
        Sem intermediários
        <br />
        e sem taxas escondidas
      </>
    ),
    brazilEyebrow: "INTEGRADA E PRÁTICA",
    brazilHeadline: (
      <>
        Tabela FIPE oficial
        <br />
        e contato no WhatsApp
      </>
    ),
    endHeadline: (
      <>
        A plataforma de carros e peças
        <br />
        mais completa do mercado.
      </>
    ),
  },
  br: {
    kicker: "RECARGARAGE BRASIL",
    hookLines: [
      "A plataforma de carros",
      <React.Fragment key="l2">
        mais <Accent>completa</Accent> da Europa
      </React.Fragment>,
      "chegou ao Brasil!",
    ],
    statsEyebrow: "SUCESSO EM PORTUGAL",
    statsHeadline: (
      <>
        Tudo o que você precisa,
        <br />
        reunido em um só lugar
      </>
    ),
    zeroEyebrow: "100% DIRETO",
    zeroHeadline: (
      <>
        Sem intermediários
        <br />
        e sem taxas escondidas
      </>
    ),
    brazilEyebrow: "INTEGRADA E PRÁTICA",
    brazilHeadline: (
      <>
        Tabela FIPE oficial
        <br />
        e contato no WhatsApp
      </>
    ),
    endHeadline: (
      <>
        A plataforma de carros e peças
        <br />
        mais completa do mercado.
      </>
    ),
  },
} as const;

/** Mock detailing the success numbers in Europe */
const StatsMock: React.FC = () => {
  const frame = useCurrentFrame();
  const enter1 = fadeUp(frame, 10, 50);
  const enter2 = fadeUp(frame, 22, 50);
  const enter3 = fadeUp(frame, 34, 50);

  const scale1 = popIn(frame, 10);
  const scale2 = popIn(frame, 22);
  const scale3 = popIn(frame, 34);

  const v1 = countUp(frame, 20, 15000);
  const v2 = countUp(frame, 32, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 800 }}>
      <UiCard
        style={{
          padding: "32px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          opacity: enter1.opacity,
          translate: enter1.translate,
          scale: String(scale1),
        }}
      >
        <GlobeHemisphereWest size={64} weight="bold" color={colors.primary} />
        <div>
          <div style={{ fontSize: 44, fontWeight: 900, color: colors.ink }}>
            +{v1.toLocaleString("pt-BR")}
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: colors.primaryDark }}>
            Anúncios ativos em Portugal
          </div>
        </div>
      </UiCard>

      <UiCard
        style={{
          padding: "32px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          opacity: enter2.opacity,
          translate: enter2.translate,
          scale: String(scale2),
        }}
      >
        <Percent size={64} weight="bold" color={colors.success} />
        <div>
          <div style={{ fontSize: 44, fontWeight: 900, color: colors.success }}>
            {v2}% comissão nas vendas
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: colors.primaryDark }}>
            Anuncie e negocie livremente
          </div>
        </div>
      </UiCard>

      <UiCard
        style={{
          padding: "32px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          opacity: enter3.opacity,
          translate: enter3.translate,
          scale: String(scale3),
        }}
      >
        <Sparkle size={64} weight="bold" color={colors.secondary} />
        <div>
          <div style={{ fontSize: 38, fontWeight: 900, color: colors.ink }}>
            A Mais Completa
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: colors.primaryDark }}>
            Carros, Peças e Oficinas em um só app
          </div>
        </div>
      </UiCard>
    </div>
  );
};

/** Mock presenting the zero fees comparison (viral detail) */
const ZeroFeeMock: React.FC = () => {
  const frame = useCurrentFrame();
  const enter1 = fadeUp(frame, 10, 55);
  const scale1 = popIn(frame, 10);
  const enter2 = fadeUp(frame, 28, 55);
  const scale2 = popIn(frame, 28);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 800 }}>
      {/* Traditional platforms */}
      <UiCard
        style={{
          padding: "36px 44px",
          opacity: enter1.opacity,
          translate: enter1.translate,
          scale: String(scale1),
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>
          Outros portais
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#ef4444", textDecoration: "line-through", marginTop: 8 }}>
          Taxas abusivas e comissões
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: "#64748b", marginTop: 4 }}>
          Intermediações burocráticas
        </div>
      </UiCard>

      {/* RecarGarage Zero Fee Callout */}
      <UiCard
        style={{
          padding: "40px 44px",
          border: `4px solid ${colors.success}`,
          boxShadow: `0 20px 60px rgba(16, 185, 129, 0.25)`,
          opacity: enter2.opacity,
          translate: enter2.translate,
          scale: String(scale2),
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: colors.success, textTransform: "uppercase" }}>
              Na RecarGarage
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, color: colors.ink, marginTop: 8 }}>
              R$ 0,00 Taxas
            </div>
            <div style={{ fontSize: 26, fontWeight: 600, color: colors.primaryDark, marginTop: 4 }}>
              Negócio direto com o dono
            </div>
          </div>
          <Coins size={96} weight="fill" color={colors.success} />
        </div>
      </UiCard>
    </div>
  );
};

/** Mock showcasing Brazilian integrations (PIX and WhatsApp) */
const BrazilReadyMock: React.FC = () => {
  const frame = useCurrentFrame();
  const enter1 = fadeUp(frame, 10, 50);
  const scale1 = popIn(frame, 10);
  const enter2 = fadeUp(frame, 25, 50);
  const scale2 = popIn(frame, 25);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 800 }}>
      <UiCard
        style={{
          padding: "34px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          opacity: enter1.opacity,
          translate: enter1.translate,
          scale: String(scale1),
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#25d3661f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WhatsappLogo size={48} weight="fill" color="#25D366" />
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800, color: colors.ink }}>
            Contato direto por WhatsApp
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: colors.primaryDark }}>
            Fale sem intermediários
          </div>
        </div>
      </UiCard>

      <UiCard
        style={{
          padding: "34px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          opacity: enter2.opacity,
          translate: enter2.translate,
          scale: String(scale2),
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: `${colors.secondary}1f`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle size={48} weight="bold" color={colors.secondary} />
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800, color: colors.ink }}>
            Tabela FIPE Oficial
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: colors.primaryDark }}>
            Consulte preços reais e atualizados do Brasil
          </div>
        </div>
      </UiCard>
    </div>
  );
};

const makeScenes = (locale: Locale): ReelScene[] => {
  const c = COPY[locale];
  return [
    {
      durationInFrames: 110,
      content: (
        <HookScene kicker={c.kicker} lines={[...c.hookLines]} fontSize={88} />
      ),
    },
    {
      durationInFrames: 190,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.statsEyebrow} headline={c.statsHeadline} />}
          visual={<StatsMock />}
        />
      ),
    },
    {
      durationInFrames: 200,
      content: (
        <SceneShell
          tint="orange"
          heading={<SceneHeading eyebrow={c.zeroEyebrow} headline={c.zeroHeadline} accent={colors.success} />}
          visual={<ZeroFeeMock />}
        />
      ),
    },
    {
      durationInFrames: 190,
      content: (
        <SceneShell
          tint="blue"
          heading={<SceneHeading eyebrow={c.brazilEyebrow} headline={c.brazilHeadline} />}
          visual={<BrazilReadyMock />}
        />
      ),
    },
    {
      durationInFrames: 180,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const launchBrazilScenes = makeScenes("pt");
export const launchBrazilScenesBR = makeScenes("br");

export const LaunchBrazilReel: React.FC = () => (
  <Reel scenes={launchBrazilScenes} musicOffsetSeconds={0} />
);

export const LaunchBrazilReelBR: React.FC = () => (
  <Reel scenes={launchBrazilScenesBR} musicOffsetSeconds={0} />
);
