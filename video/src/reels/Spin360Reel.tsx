import React from "react";
import { useCurrentFrame, interpolate, Img, staticFile } from "remotion";
import { HandPointing, CameraRotate } from "@phosphor-icons/react";
import { Reel, ReelScene } from "../components/Reel";
import { HookScene, Accent } from "../components/HookScene";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { EndCard } from "../components/EndCard";
import { UiCard } from "../components/UiCard";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn, easeProgress } from "../anim";

const ANGLES = ["Frente", "Lateral direita", "Traseira", "Lateral esquerda"];

/**
 * Drag-to-rotate viewer mock: listing photo with the 360 badge, a hand
 * sweeping left-right and the 8-dot orbit cycling through the angles.
 */
const SpinViewerMock: React.FC = () => {
  const frame = useCurrentFrame();
  const card = fadeUp(frame, 10, 55);
  const cardScale = popIn(frame, 10);
  const badge = popIn(frame, 40);
  const badgeOpacity = easeProgress(frame, 40, 12);

  // The drag loops back and forth; orbit dots + angle label follow it.
  const drag = interpolate(frame, [56, 176], [0, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweep = Math.abs(1 - (drag % 2)); // 1 → 0 → 1 ping-pong
  const handX = interpolate(sweep, [0, 1], [-170, 170]);
  const activeDot = Math.floor(
    interpolate(sweep, [0, 1], [0, 7.99]),
  );
  const angleLabel = ANGLES[Math.floor(interpolate(sweep, [0, 1], [0, 3.99]))];
  const handOpacity = easeProgress(frame, 56, 14);

  return (
    <UiCard
      width={780}
      style={{
        opacity: card.opacity,
        translate: card.translate,
        scale: String(cardScale),
      }}
    >
      <div style={{ position: "relative", height: 470 }}>
        <Img
          src={staticFile("brand/car-3.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            opacity: badgeOpacity,
            scale: String(badge),
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: colors.primary,
            color: colors.white,
            fontFamily: brandFont,
            fontWeight: 800,
            fontSize: 30,
            padding: "12px 24px",
            borderRadius: 999,
          }}
        >
          <CameraRotate size={38} weight="bold" />
          360°
        </div>
        {/* Drag hand sweeping over the photo */}
        <div
          style={{
            position: "absolute",
            bottom: 26,
            left: "50%",
            opacity: handOpacity,
            translate: `${handX}px 0px`,
          }}
        >
          <HandPointing size={84} weight="fill" color={colors.white} />
        </div>
      </div>

      <div
        style={{
          padding: "30px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 38, color: colors.ink }}>
            {angleLabel}
          </span>
          <span style={{ fontWeight: 600, fontSize: 28, color: "#6c6e72" }}>
            Arrasta para rodar
          </span>
        </div>
        {/* 8-dot orbit indicator */}
        <div style={{ display: "flex", gap: 12 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: i === activeDot ? colors.secondary : "#d8e0ea",
              }}
            />
          ))}
        </div>
      </div>
    </UiCard>
  );
};

const CAPTURE_ANGLES = 8;

/**
 * Guided capture mock: dashed viewfinder frame, angle label, progress and
 * the top-down walk-around diagram — echoing GuidedSpinCapture.
 */
const GuidedCaptureMock: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = fadeUp(frame, 12, 55);
  const scale = popIn(frame, 12);
  const progress = Math.min(
    CAPTURE_ANGLES,
    3 + Math.floor(easeProgress(frame, 40, 90) * 3),
  );
  const shutter = popIn(frame, 70);

  return (
    <UiCard
      width={760}
      style={{
        opacity: enter.opacity,
        translate: enter.translate,
        scale: String(scale),
        background: colors.ink,
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 32, color: colors.white }}>
          Captura guiada 360°
        </span>
        <span
          style={{
            fontWeight: 800,
            fontSize: 30,
            color: colors.white,
            background: "rgba(255,255,255,0.14)",
            padding: "10px 22px",
            borderRadius: 999,
          }}
        >
          {progress}/8
        </span>
      </div>

      {/* Viewfinder with dashed 4:3 frame over the "live camera" */}
      <div style={{ position: "relative", height: 430, borderRadius: 22, overflow: "hidden" }}>
        <Img
          src={staticFile("brand/car-3.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 26,
            border: `5px dashed ${colors.white}`,
            borderRadius: 18,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 44,
            left: "50%",
            translate: "-50% 0px",
            background: colors.secondary,
            color: colors.white,
            fontFamily: brandFont,
            fontWeight: 800,
            fontSize: 30,
            padding: "12px 28px",
            borderRadius: 999,
          }}
        >
          Traseira
        </div>
        {/* Shutter pulse */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: "50%",
            translate: "-50% 0px",
            scale: String(shutter),
            width: 92,
            height: 92,
            borderRadius: "50%",
            background: colors.white,
            border: `8px solid rgba(255,255,255,0.4)`,
          }}
        />
      </div>

      <span style={{ fontWeight: 600, fontSize: 28, color: "#b9c2ce", fontFamily: brandFont }}>
        A app diz-te onde te pôr — as fotos ficam marcadas sozinhas
      </span>
    </UiCard>
  );
};

export const spin360Scenes: ReelScene[] = [
  {
    durationInFrames: 105,
    content: (
      <HookScene
        kicker="Para stands"
        lines={[
          "O comprador quer",
          "andar à volta",
          <>
            do carro. <Accent>Deixa-o.</Accent>
          </>,
        ]}
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
            eyebrow="Vista 360°"
            headline={
              <>
                Arrasta e roda
                <br />o carro
              </>
            }
          />
        }
        visual={<SpinViewerMock />}
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
            eyebrow="Captura guiada"
            headline={
              <>
                Sem equipamento.
                <br />
                Só o telemóvel.
              </>
            }
          />
        }
        visual={<GuidedCaptureMock />}
      />
    ),
  },
  {
    durationInFrames: 170,
    content: (
      <EndCard
        headline={
          <>
            O teu anúncio
            <br />
            em 360°.
          </>
        }
      />
    ),
  },
];

/** Reel 11 — 360° spin view: drag-to-rotate + guided capture (plan 23). */
export const Spin360Reel: React.FC = () => (
  <Reel scenes={spin360Scenes} musicOffsetSeconds={4} />
);
