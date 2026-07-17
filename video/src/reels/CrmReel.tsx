import React from "react";
import { useCurrentFrame } from "remotion";
import { MagnifyingGlass, FileCsv, CheckCircle } from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { Locale } from "../copy";
import { fadeUp, popIn, countUp, easeProgress } from "../anim";

const COPY = {
  pt: {
    kicker: "Para oficinas",
    hookLines: [
      "Os teus clientes",
      "ainda vivem",
      <React.Fragment key="l3">
        num <Accent>caderno?</Accent>
      </React.Fragment>,
    ],
    searchPlaceholder: "Pesquisar por nome, email ou telefone…",
    clients: [
      { initials: "MF", name: "Maria Fernandes", car: "VW Golf VII · Revisão", status: "Ativo", statusColor: colors.success },
      { initials: "JS", name: "João Santos", car: "BMW 320d · Travões", status: "Lead", statusColor: colors.secondary },
      { initials: "AP", name: "Ana Pereira", car: "Fiat Punto · Embraiagem", status: "Ativo", statusColor: colors.success },
    ],
    listEyebrow: "CRM de Clientes",
    listHeadline: (
      <>
        Todos os clientes
        <br />
        num só lugar
      </>
    ),
    csvFile: "clientes-oficina.csv",
    csvProgress: (n: number) => `${n} de 128 clientes`,
    csvDone: "Importação concluída — sem escrever um a um",
    csvEyebrow: "Importação CSV",
    csvHeadline: (
      <>
        Traz a tua lista
        <br />
        em segundos
      </>
    ),
    endHeadline: (
      <>
        O CRM da tua oficina.
        <br />
        Já incluído.
      </>
    ),
  },
  br: {
    kicker: "Para oficinas",
    hookLines: [
      "Seus clientes",
      "ainda vivem",
      <React.Fragment key="l3">
        num <Accent>caderno?</Accent>
      </React.Fragment>,
    ],
    searchPlaceholder: "Buscar por nome, email ou telefone…",
    clients: [
      { initials: "MF", name: "Maria Fernandes", car: "VW Golf VII · Revisão", status: "Ativo", statusColor: colors.success },
      { initials: "JS", name: "João Santos", car: "BMW 320d · Freios", status: "Lead", statusColor: colors.secondary },
      { initials: "AP", name: "Ana Pereira", car: "Fiat Argo · Embreagem", status: "Ativo", statusColor: colors.success },
    ],
    listEyebrow: "CRM de Clientes",
    listHeadline: (
      <>
        Todos os clientes
        <br />
        num só lugar
      </>
    ),
    csvFile: "clientes-oficina.csv",
    csvProgress: (n: number) => `${n} de 128 clientes`,
    csvDone: "Importação concluída — sem digitar um a um",
    csvEyebrow: "Importação CSV",
    csvHeadline: (
      <>
        Traga sua lista
        <br />
        em segundos
      </>
    ),
    endHeadline: (
      <>
        O CRM da sua oficina.
        <br />
        Já incluído.
      </>
    ),
  },
} as const;

type Copy = (typeof COPY)[Locale];

/** Searchable client list, echoing the /painel CRM grid. */
const ClientListMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const search = fadeUp(frame, 10, 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: 820 }}>
      <UiCard
        width="100%"
        style={{
          opacity: search.opacity,
          translate: search.translate,
          padding: "26px 34px",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <MagnifyingGlass size={40} weight="bold" color="#6c6e72" />
        <span style={{ fontWeight: 600, fontSize: 34, color: "#9aa0a6" }}>
          {c.searchPlaceholder}
        </span>
      </UiCard>

      {c.clients.map((client, i) => {
        const enter = fadeUp(frame, 30 + i * 16, 50);
        const scale = popIn(frame, 30 + i * 16);
        return (
          <UiCard
            key={client.name}
            width="100%"
            style={{
              opacity: enter.opacity,
              translate: enter.translate,
              scale: String(scale),
              padding: "28px 34px",
              display: "flex",
              alignItems: "center",
              gap: 26,
            }}
          >
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: `${colors.primary}1f`,
                color: colors.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 36,
                flexShrink: 0,
              }}
            >
              {client.initials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 36, color: colors.ink }}>
                {client.name}
              </span>
              <span style={{ fontWeight: 600, fontSize: 28, color: "#6c6e72" }}>
                {client.car}
              </span>
            </div>
            <div
              style={{
                background: `${client.statusColor}1f`,
                color: client.statusColor,
                fontWeight: 800,
                fontSize: 28,
                padding: "12px 26px",
                borderRadius: 999,
                flexShrink: 0,
              }}
            >
              {client.status}
            </div>
          </UiCard>
        );
      })}
    </div>
  );
};

/** CSV import card: progress bar filling + imported counter. */
const CsvImportMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const enter = fadeUp(frame, 14, 50);
  const scale = popIn(frame, 14);
  const progress = easeProgress(frame, 34, 60);
  const imported = countUp(frame, 34, 128, 60);
  const done = fadeUp(frame, 100, 30);

  return (
    <UiCard
      width={780}
      style={{
        opacity: enter.opacity,
        translate: enter.translate,
        scale: String(scale),
        padding: "44px 46px",
        display: "flex",
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 26,
            background: `${colors.success}1f`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileCsv size={56} weight="bold" color={colors.success} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 40, color: colors.ink }}>
            {c.csvFile}
          </span>
          <span style={{ fontWeight: 600, fontSize: 30, color: "#6c6e72" }}>
            {c.csvProgress(imported)}
          </span>
        </div>
      </div>

      <div style={{ height: 26, borderRadius: 999, background: "#e8edf4", overflow: "hidden" }}>
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: colors.success,
          }}
        />
      </div>

      <div
        style={{
          opacity: done.opacity,
          translate: done.translate,
          display: "flex",
          alignItems: "center",
          gap: 14,
          color: colors.success,
          fontWeight: 800,
          fontSize: 34,
          fontFamily: brandFont,
        }}
      >
        <CheckCircle size={44} weight="fill" />
        {c.csvDone}
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
          heading={<SceneHeading eyebrow={c.listEyebrow} headline={c.listHeadline} />}
          visual={<ClientListMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 190,
      content: (
        <SceneShell
          tint="blue"
          heading={
            <SceneHeading
              eyebrow={c.csvEyebrow}
              headline={c.csvHeadline}
              accent={colors.success}
            />
          }
          visual={<CsvImportMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const crmScenes = makeScenes("pt");
export const crmScenesBR = makeScenes("br");

/** Reel 02 — client CRM for workshops (professional dashboard). */
export const CrmReel: React.FC = () => (
  <Reel scenes={crmScenes} musicOffsetSeconds={0} />
);

/** Reel 02 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const CrmReelBR: React.FC = () => (
  <Reel scenes={crmScenesBR} musicOffsetSeconds={0} />
);
