import React from "react";
import { useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { colors } from "../theme";
import { brandFont } from "../fonts";
import { fadeUp, popIn } from "../anim";

const MESSAGES = [
  { from: "them", text: "Olá! O carro ainda está disponível?" },
  { from: "me", text: "Está sim! Quer combinar uma visita?" },
  { from: "them", text: "Perfeito. Amanhã às 18h?" },
];

const Bubble: React.FC<{
  text: string;
  mine: boolean;
  frame: number;
  delay: number;
}> = ({ text, mine, frame, delay }) => {
  const enter = fadeUp(frame, delay, 40);
  const scale = popIn(frame, delay);
  return (
    <div
      style={{
        alignSelf: mine ? "flex-end" : "flex-start",
        opacity: enter.opacity,
        translate: enter.translate,
        scale: String(scale),
        maxWidth: "78%",
        background: mine ? colors.primary : colors.white,
        color: mine ? colors.white : colors.ink,
        fontFamily: brandFont,
        fontWeight: 600,
        fontSize: 40,
        lineHeight: 1.25,
        padding: "28px 34px",
        borderRadius: 34,
        borderBottomRightRadius: mine ? 8 : 34,
        borderBottomLeftRadius: mine ? 34 : 8,
        boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
      }}
    >
      {text}
    </div>
  );
};

/** Feature 4 — talk directly with the seller. */
export const Chat: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneShell
      tint="blue"
      heading={
        <SceneHeading
          eyebrow="Mensagens"
          headline={
            <>
              Fala direto com
              <br />o vendedor
            </>
          }
        />
      }
      visual={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 30,
            width: 760,
          }}
        >
          {MESSAGES.map((m, i) => (
            <Bubble
              key={i}
              text={m.text}
              mine={m.from === "me"}
              frame={frame}
              delay={26 + i * 22}
            />
          ))}
        </div>
      }
    />
  );
};
