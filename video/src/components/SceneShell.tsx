import React from "react";
import { AbsoluteFill } from "remotion";
import { Background } from "./Background";
import { useFormat } from "../format";

/**
 * Responsive layout wrapper shared by the feature scenes. It draws the brand
 * Background and arranges a `heading` and a `visual`:
 *   - portrait / square → stacked column (heading on top, visual below)
 *   - landscape (16:9)   → two columns side by side (heading left, visual right)
 *
 * Centralising this here means new videos can reuse the exact same responsive
 * behaviour just by passing different heading/visual content.
 */
export const SceneShell: React.FC<{
  tint?: "blue" | "orange";
  heading: React.ReactNode;
  visual: React.ReactNode;
}> = ({ tint = "blue", heading, visual }) => {
  const { isLandscape } = useFormat();

  const slot: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flex: isLandscape ? 1 : undefined,
    minWidth: 0,
  };

  return (
    <AbsoluteFill>
      <Background tint={tint} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: isLandscape ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isLandscape ? 70 : 72,
          padding: isLandscape ? "70px 110px" : "100px 60px",
        }}
      >
        <div style={slot}>{heading}</div>
        <div style={slot}>{visual}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
