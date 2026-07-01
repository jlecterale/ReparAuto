import React from "react";
import { useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { SceneHeading } from "../components/SceneHeading";
import { ListingCard } from "../components/ListingCard";
import { colors } from "../theme";
import { fadeUp, popIn } from "../anim";

/** Feature 1 — thousands of used cars, including low-cost / to-repair. */
export const Carros: React.FC = () => {
  const frame = useCurrentFrame();
  const card = fadeUp(frame, 30, 90);
  const scale = popIn(frame, 30);
  const card2 = fadeUp(frame, 48, 70);

  return (
    <SceneShell
      tint="blue"
      heading={
        <SceneHeading
          eyebrow="Carros usados"
          headline={
            <>
              Milhares de carros
              <br />
              num só lugar
            </>
          }
        />
      }
      visual={
        <div style={{ position: "relative", width: 720, height: 660 }}>
          {/* Back card, peeking from the top-right for a stacked-deck feel */}
          <div
            style={{
              position: "absolute",
              top: -34,
              left: 150,
              opacity: card2.opacity * 0.85,
              translate: card2.translate,
              rotate: "6deg",
            }}
          >
            <ListingCard
              image="brand/car-2.png"
              title="Mercedes Classe C"
              subtitle="2018 · 98.000 km · Diesel"
              price="18.900 €"
              tag="Verificado"
              width={540}
            />
          </div>
          {/* Front card */}
          <div
            style={{
              position: "absolute",
              top: 70,
              left: 20,
              opacity: card.opacity,
              translate: card.translate,
              scale: String(scale),
            }}
          >
            <ListingCard
              image="images/clio-low-cost.jpg"
              title="Renault Clio"
              subtitle="2005 · 198.000 km · Gasolina"
              price="900 €"
              tag="Low-cost"
              tagColor={colors.secondary}
              width={560}
            />
          </div>
        </div>
      }
    />
  );
};
