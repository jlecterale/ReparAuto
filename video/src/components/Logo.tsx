import React from "react";
import { Img, staticFile } from "remotion";
import { colors } from "../theme";
import { brandFont } from "../fonts";

/**
 * RecarGarage lockup: the "R" app icon next to the wordmark.
 * `layout="row"` for headers/CTA, `layout="stack"` for centered hero moments.
 */
export const Logo: React.FC<{
  size?: number;
  layout?: "row" | "stack";
  color?: string;
}> = ({ size = 120, layout = "row", color = colors.white }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: layout === "row" ? "row" : "column",
        alignItems: "center",
        gap: layout === "row" ? size * 0.28 : size * 0.22,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.24,
          background: colors.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <Img
          src={staticFile("brand/app-icon.png")}
          style={{ width: "78%", height: "78%" }}
        />
      </div>
      <div
        style={{
          fontFamily: brandFont,
          fontWeight: 800,
          fontSize: size * 0.62,
          letterSpacing: -1,
          color,
          lineHeight: 1,
        }}
      >
        Recar<span style={{ color: colors.secondary }}>Garage</span>
      </div>
    </div>
  );
};
