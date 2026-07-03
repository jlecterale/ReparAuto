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
import { fadeUp, popIn, countUp, easeProgress } from "../anim";

const CLIENTS = [
  { initials: "MF", name: "Maria Fernandes", car: "VW Golf VII · Revisão", status: "Ativo", statusColor: colors.success },
  { initials: "JS", name: "João Santos", car: "BMW 320d · Travões", status: "Lead", statusColor: colors.secondary },
  { initials: "AP", name: "Ana Pereira", car: "Fiat Punto · Embraiagem", status: "Ativo", statusColor: colors.success },
] as const;

/** Searchable client list, echoing the /painel CRM grid. */
const ClientListMock: React.FC = () => {
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
          Pesquisar por nome, email ou telefone…
        </span>
      </UiCard>

      {CLIENTS.map((c, i) => {
        const enter = fadeUp(frame, 30 + i * 16, 50);
        const scale = popIn(frame, 30 + i * 16);
        return (
          <UiCard
            key={c.name}
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
              {c.initials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 36, color: colors.ink }}>
                {c.name}
              </span>
              <span style={{ fontWeight: 600, fontSize: 28, color: "#6c6e72" }}>
                {c.car}
              </span>
            </div>
            <div
              style={{
                background: `${c.statusColor}1f`,
                color: c.statusColor,
                fontWeight: 800,
                fontSize: 28,
                padding: "12px 26px",
                borderRadius: 999,
                flexShrink: 0,
              }}
            >
              {c.status}
            </div>
          </UiCard>
        );
      })}
    </div>
  );
};

/** CSV import card: progress bar filling + imported counter. */
const CsvImportMock: React.FC = () => {
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
            clientes-oficina.csv
          </span>
          <span style={{ fontWeight: 600, fontSize: 30, color: "#6c6e72" }}>
            {imported} de 128 clientes
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
        Importação concluída — sem escrever um a um
      </div>
    </UiCard>
  );
};

export const crmScenes: ReelScene[] = [
  {
    durationInFrames: 100,
    content: (
      <HookScene
        kicker="Para oficinas"
        tint="orange"
        lines={[
          "Os teus clientes",
          "ainda vivem",
          <>
            num <Accent>caderno?</Accent>
          </>,
        ]}
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
            eyebrow="CRM de Clientes"
            headline={
              <>
                Todos os clientes
                <br />
                num só lugar
              </>
            }
          />
        }
        visual={<ClientListMock />}
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
            eyebrow="Importação CSV"
            headline={
              <>
                Traz a tua lista
                <br />
                em segundos
              </>
            }
            accent={colors.success}
          />
        }
        visual={<CsvImportMock />}
      />
    ),
  },
  {
    durationInFrames: 170,
    content: (
      <EndCard
        headline={
          <>
            O CRM da tua oficina.
            <br />
            Já incluído.
          </>
        }
      />
    ),
  },
];

/** Reel 02 — client CRM for workshops (professional dashboard). */
export const CrmReel: React.FC = () => (
  <Reel scenes={crmScenes} musicOffsetSeconds={0} />
);
