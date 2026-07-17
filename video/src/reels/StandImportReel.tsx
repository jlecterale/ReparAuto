import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import {
  LinkSimple,
  CheckCircle,
  SealCheck,
  DownloadSimple,
  CircleNotch,
} from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn, easeProgress, typeText, countUp } from "../anim";

const PASTED_URL = "standvirtual.com/bmw-320d-ID9k2x4.html";

const FILLED = [
  "Ficha técnica completa",
  "Fotos incluídas",
  "Só falta rever e publicar",
] as const;

/** "Import 1" card: the URL being pasted, the button, and what gets filled. */
const PasteUrlMock: React.FC = () => {
  const frame = useCurrentFrame();
  const card = fadeUp(frame, 10, 55);
  const cardScale = popIn(frame, 10);
  const typed = typeText(frame, 24, PASTED_URL, 1.3);
  // Button "press" right after the URL finishes typing.
  const press = interpolate(frame, [78, 84, 90], [1, 0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <UiCard
      width={780}
      style={{
        opacity: card.opacity,
        translate: card.translate,
        scale: String(cardScale),
        padding: "40px 44px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <span style={{ fontWeight: 800, fontSize: 40, color: colors.ink }}>
        Já anuncias no Standvirtual?
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "#f4f7fb",
          border: `3px solid ${colors.primary}55`,
          borderRadius: 20,
          padding: "22px 26px",
        }}
      >
        <LinkSimple size={40} weight="bold" color={colors.primary} />
        <span
          style={{
            fontWeight: 600,
            fontSize: 29,
            color: colors.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {typed}
          <span
            style={{
              opacity:
                frame % 20 < 10 && typed.length < PASTED_URL.length ? 1 : 0,
            }}
          >
            |
          </span>
        </span>
      </div>

      <div
        style={{
          scale: String(press),
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: colors.secondary,
          color: colors.white,
          fontWeight: 800,
          fontSize: 34,
          padding: "20px 36px",
          borderRadius: 999,
        }}
      >
        <DownloadSimple size={42} weight="bold" />
        Pré-preencher formulário
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {FILLED.map((item, i) => {
          const enter = fadeUp(frame, 96 + i * 14, 35);
          const check = popIn(frame, 100 + i * 14);
          const checkOpacity = easeProgress(frame, 100 + i * 14, 10);
          return (
            <div
              key={item}
              style={{
                opacity: enter.opacity,
                translate: enter.translate,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ scale: String(check), opacity: checkOpacity, display: "flex" }}>
                <CheckCircle size={40} weight="fill" color={colors.success} />
              </span>
              <span style={{ fontWeight: 700, fontSize: 32, color: colors.ink }}>
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </UiCard>
  );
};

const BATCH_ROWS = [
  { name: "BMW 320d Touring", doneAt: 30 },
  { name: "Renault Captur 1.3 TCe", doneAt: 58 },
  { name: "Peugeot 2008 PureTech", doneAt: 96 },
] as const;

/** Batch/whole-stand import: per-car progress list + verified-pro pill. */
const BatchImportMock: React.FC = () => {
  const frame = useCurrentFrame();
  const header = fadeUp(frame, 8, 45);
  const imported = countUp(frame, 16, 25, 110);
  const progress = easeProgress(frame, 16, 110);
  const pill = fadeUp(frame, 130, 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <UiCard
        width={800}
        style={{
          opacity: header.opacity,
          translate: header.translate,
          padding: "36px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: 38, color: colors.ink }}>
            A importar o teu stand…
          </span>
          <span style={{ fontWeight: 800, fontSize: 36, color: colors.primary }}>
            {imported}/25
          </span>
        </div>

        <div style={{ height: 22, borderRadius: 999, background: "#e8edf4", overflow: "hidden" }}>
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: 999,
              background: colors.primary,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {BATCH_ROWS.map((row, i) => {
            const enter = fadeUp(frame, 14 + i * 12, 35);
            const done = frame >= row.doneAt;
            const spin = ((frame * 12) % 360) + 0;
            return (
              <div
                key={row.name}
                style={{
                  opacity: enter.opacity,
                  translate: enter.translate,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 18,
                  background: "#f4f7fb",
                  borderRadius: 18,
                  padding: "18px 26px",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 32, color: colors.ink }}>
                  {row.name}
                </span>
                {done ? (
                  <span
                    style={{
                      scale: String(popIn(frame, row.doneAt)),
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: colors.success,
                      fontWeight: 800,
                      fontSize: 28,
                    }}
                  >
                    <CheckCircle size={36} weight="fill" />
                    Criado
                  </span>
                ) : (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: colors.primary,
                      fontWeight: 700,
                      fontSize: 28,
                    }}
                  >
                    <span style={{ display: "flex", rotate: `${spin}deg` }}>
                      <CircleNotch size={34} weight="bold" />
                    </span>
                    A importar…
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </UiCard>

      <div
        style={{
          opacity: pill.opacity,
          translate: pill.translate,
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
        <SealCheck size={40} weight="fill" color={colors.mist} />
        Stand inteiro: para profissionais verificados
      </div>
    </div>
  );
};

export const standImportScenes: ReelScene[] = [
  {
    durationInFrames: 105,
    content: (
      <HookScene
        kicker="Para stands"
        lines={[
          "E se trazer o stand",
          "inteiro fosse colar",
          <Accent key="a">um link?</Accent>,
        ]}
      />
    ),
  },
  {
    durationInFrames: 230,
    content: (
      <SceneShell
        tint="blue"
        heading={
          <SceneHeading
            eyebrow="Importar do Standvirtual"
            headline={
              <>
                Cola o URL.
                <br />
                Está feito.
              </>
            }
          />
        }
        visual={<PasteUrlMock />}
      />
    ),
  },
  {
    durationInFrames: 220,
    content: (
      <SceneShell
        tint="orange"
        heading={
          <SceneHeading
            eyebrow="Em lote"
            headline={
              <>
                O stand inteiro,
                <br />
                de uma vez
              </>
            }
          />
        }
        visual={<BatchImportMock />}
      />
    ),
  },
  {
    durationInFrames: 170,
    content: (
      <EndCard
        headline={
          <>
            O teu stand no
            <br />
            RecarGarage. Hoje.
          </>
        }
      />
    ),
  },
];

/** Reel 15 — Standvirtual import: paste a URL, batch, whole stand (PR #78). */
export const StandImportReel: React.FC = () => (
  <Reel scenes={standImportScenes} musicOffsetSeconds={7} />
);
