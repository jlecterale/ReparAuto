import React from "react";
import { colors } from "../theme";
import { brandFont } from "../fonts";

/**
 * White app-style panel used by the reel UI mock-ups (dashboard, CRM, chat…),
 * echoing the marketplace's card idiom. Purely presentational — callers
 * animate it via opacity/translate/scale.
 */
export const UiCard: React.FC<{
  width?: number | string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ width = 760, style, children }) => (
  <div
    style={{
      width,
      background: colors.white,
      borderRadius: 32,
      boxShadow: "0 36px 80px rgba(0,0,0,0.4)",
      fontFamily: brandFont,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);
