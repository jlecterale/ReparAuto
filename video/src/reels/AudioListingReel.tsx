import React from "react";
import { useCurrentFrame } from "remotion";
import {
  Microphone,
  Sparkle,
  CheckCircle,
  WhatsappLogo,
  Camera,
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
import { fadeUp, popIn, easeProgress, typeText } from "../anim";

const COPY = {
  pt: {
    kicker: "Para stands e oficinas",
    hookLines: [
      "E se anunciar",
      "um carro fosse",
      <React.Fragment key="l3">
        só… <Accent>falar?</Accent>
      </React.Fragment>,
    ],
    quote:
      "“É um Renault Clio de 2012, gasolina, 180 mil quilómetros, em Lisboa… quero 4 500 euros.”",
    recording: (s: string) => `A gravar… 0:${s}`,
    whatsapp: "Ou envia um áudio — até voice note serve",
    voiceEyebrow: "Anúncio por áudio",
    voiceHeadline: (
      <>
        Descreve o carro
        <br />
        com a tua voz
      </>
    ),
    fillButton: "Preencher com IA",
    fields: [
      { label: "Marca", value: "Renault" },
      { label: "Modelo", value: "Clio" },
      { label: "Ano", value: "2012" },
      { label: "Quilómetros", value: "180 000 km" },
      { label: "Combustível", value: "Gasolina" },
      { label: "Preço", value: "4 500 €" },
    ],
    photosNote: "Só falta rever e juntar as fotos",
    fillEyebrow: "A IA escreve",
    fillHeadline: (
      <>
        O formulário
        <br />
        preenche-se sozinho
      </>
    ),
    endHeadline: (
      <>
        Fala. Revê.
        <br />
        Publica.
      </>
    ),
  },
  br: {
    kicker: "Para lojistas e oficinas",
    hookLines: [
      "E se anunciar",
      "um carro fosse",
      <React.Fragment key="l3">
        só… <Accent>falar?</Accent>
      </React.Fragment>,
    ],
    quote:
      "“É um Fiat Argo 2020, flex, 60 mil quilômetros, em São Paulo… quero 62 mil reais.”",
    recording: (s: string) => `Gravando… 0:${s}`,
    whatsapp: "Ou envie um áudio — até áudio do WhatsApp serve",
    voiceEyebrow: "Anúncio por áudio",
    voiceHeadline: (
      <>
        Descreva o carro
        <br />
        com a sua voz
      </>
    ),
    fillButton: "Preencher com IA",
    fields: [
      { label: "Marca", value: "Fiat" },
      { label: "Modelo", value: "Argo" },
      { label: "Ano", value: "2020" },
      { label: "Quilômetros", value: "60 000 km" },
      { label: "Combustível", value: "Flex" },
      { label: "Preço", value: "R$ 62.000" },
    ],
    photosNote: "Só falta revisar e adicionar as fotos",
    fillEyebrow: "A IA escreve",
    fillHeadline: (
      <>
        O formulário
        <br />
        se preenche sozinho
      </>
    ),
    endHeadline: (
      <>
        Fale. Revise.
        <br />
        Publique.
      </>
    ),
  },
} as const;

type Copy = (typeof COPY)[Locale];

const WAVE_BARS = 24;

/**
 * "Preencher por voz" card: pulsing mic, live waveform, timer, the spoken
 * sentence appearing as it's said, and the WhatsApp voice-note pill.
 */
const VoiceRecorderMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const card = fadeUp(frame, 10, 55);
  const cardScale = popIn(frame, 10);
  // Mic "breathes" while recording.
  const pulse = 1 + 0.06 * Math.sin(frame / 5);
  const ring = 1 + ((frame % 40) / 40) * 0.5;
  const ringOpacity = 0.5 - ((frame % 40) / 40) * 0.5;
  const seconds = Math.min(23, Math.floor(easeProgress(frame, 24, 150) * 23));
  const typed = typeText(frame, 34, c.quote, 0.85);
  const whatsapp = fadeUp(frame, 150, 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <UiCard
        width={760}
        style={{
          opacity: card.opacity,
          translate: card.translate,
          scale: String(cardScale),
          padding: "40px 44px",
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `5px solid ${colors.secondary}`,
                scale: String(ring),
                opacity: ringOpacity,
              }}
            />
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: colors.secondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scale: String(pulse),
              }}
            >
              <Microphone size={62} weight="fill" color={colors.white} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 40, color: colors.ink }}>
              {c.recording(String(seconds).padStart(2, "0"))}
            </span>
            {/* Live waveform */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, height: 64 }}>
              {Array.from({ length: WAVE_BARS }, (_, i) => {
                const grew = easeProgress(frame, 20 + i * 2, 10);
                const h =
                  (18 +
                    38 *
                      Math.abs(
                        Math.sin(i * 1.7 + frame / 6) * Math.sin(i * 0.6),
                      )) *
                  grew;
                return (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: Math.max(8, h),
                      borderRadius: 999,
                      background: colors.primary,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#f4f7fb",
            borderRadius: 24,
            padding: "26px 30px",
            minHeight: 150,
            fontWeight: 600,
            fontSize: 34,
            lineHeight: 1.4,
            fontStyle: "italic",
            color: colors.ink,
          }}
        >
          {typed}
        </div>
      </UiCard>

      <div
        style={{
          opacity: whatsapp.opacity,
          translate: whatsapp.translate,
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
        <WhatsappLogo size={40} weight="bold" color={colors.mist} />
        {c.whatsapp}
      </div>
    </div>
  );
};

/** The listing form filling itself, field by field, from the audio. */
const FormFillMock: React.FC<{ c: Copy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const button = fadeUp(frame, 6, 40);
  const buttonScale = popIn(frame, 6);
  const photos = fadeUp(frame, 132, 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <div
        style={{
          opacity: button.opacity,
          translate: button.translate,
          scale: String(buttonScale),
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: colors.secondary,
          color: colors.white,
          fontFamily: brandFont,
          fontWeight: 800,
          fontSize: 36,
          padding: "22px 40px",
          borderRadius: 999,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <Sparkle size={44} weight="fill" />
        {c.fillButton}
      </div>

      <UiCard
        width={760}
        style={{ padding: "34px 40px", display: "flex", flexDirection: "column", gap: 20 }}
      >
        {c.fields.map((field, i) => {
          const enter = fadeUp(frame, 26 + i * 14, 35);
          const check = popIn(frame, 34 + i * 14);
          const checkOpacity = easeProgress(frame, 34 + i * 14, 10);
          return (
            <div
              key={field.label}
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
              <span style={{ fontWeight: 700, fontSize: 30, color: "#6c6e72" }}>
                {field.label}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 32, color: colors.ink }}>
                  {field.value}
                </span>
                <span style={{ scale: String(check), opacity: checkOpacity, display: "flex" }}>
                  <CheckCircle size={36} weight="fill" color={colors.success} />
                </span>
              </div>
            </div>
          );
        })}
      </UiCard>

      <div
        style={{
          opacity: photos.opacity,
          translate: photos.translate,
          display: "flex",
          alignItems: "center",
          gap: 14,
          color: colors.mist,
          fontFamily: brandFont,
          fontWeight: 700,
          fontSize: 32,
        }}
      >
        <Camera size={40} weight="bold" />
        {c.photosNote}
      </div>
    </div>
  );
};

const makeScenes = (locale: Locale): ReelScene[] => {
  const c = COPY[locale];
  return [
    {
      durationInFrames: 105,
      content: <HookScene kicker={c.kicker} tint="orange" lines={[...c.hookLines]} />,
    },
    {
      durationInFrames: 230,
      content: (
        <SceneShell
          tint="orange"
          heading={<SceneHeading eyebrow={c.voiceEyebrow} headline={c.voiceHeadline} />}
          visual={<VoiceRecorderMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 220,
      content: (
        <SceneShell
          tint="blue"
          heading={
            <SceneHeading
              eyebrow={c.fillEyebrow}
              headline={c.fillHeadline}
              accent={colors.success}
            />
          }
          visual={<FormFillMock c={c} />}
        />
      ),
    },
    {
      durationInFrames: 170,
      content: <EndCard headline={c.endHeadline} locale={locale} />,
    },
  ];
};

export const audioListingScenes = makeScenes("pt");
export const audioListingScenesBR = makeScenes("br");

/** Reel 14 — audio listings: speak, Gemini fills the form (PR #69). */
export const AudioListingReel: React.FC = () => (
  <Reel scenes={audioListingScenes} musicOffsetSeconds={0} />
);

/** Reel 14 (pt-BR) — same beats, Brazilian Portuguese copy. */
export const AudioListingReelBR: React.FC = () => (
  <Reel scenes={audioListingScenesBR} musicOffsetSeconds={0} />
);
