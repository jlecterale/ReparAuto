import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors } from "../theme";

/**
 * Brand background: a deep navy vertical gradient with a slow-drifting orange
 * glow and a faint hexagon (the RecarGarage nut motif) for texture.
 * `tint` shifts the accent glow between blue and orange per scene.
 */
export const Background: React.FC<{ tint?: "blue" | "orange" }> = ({
  tint = "blue",
}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 300], [0, 60], {
    extrapolateRight: "extend",
  });
  const glow = tint === "orange" ? colors.secondary : colors.primary;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${colors.primaryDeep} 0%, ${colors.primaryNight} 100%)`,
      }}
    >
      {/* Soft accent glow, slowly drifting */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${50 + drift / 3}% ${20 + drift / 6}%, ${glow}55 0%, transparent 45%)`,
        }}
      />
      {/* Second glow near the bottom */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${40 - drift / 4}% 90%, ${colors.primary}33 0%, transparent 50%)`,
        }}
      />
      {/* Faint outlined hexagon watermark */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.06,
          rotate: `${drift / 6}deg`,
        }}
      >
        <svg width={900} height={900} viewBox="0 0 100 100">
          <polygon
            points="50,3 91,26 91,74 50,97 9,74 9,26"
            fill="none"
            stroke={colors.white}
            strokeWidth={2}
          />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
