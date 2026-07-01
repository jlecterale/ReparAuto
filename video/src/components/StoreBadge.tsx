import React from "react";
import { colors } from "../theme";
import { brandFont } from "../fonts";

const AppleIcon: React.FC = () => (
  <svg width={56} height={56} viewBox="0 0 24 24" fill={colors.white}>
    <path d="M16.36 12.9c.02 2.24 1.96 2.99 1.98 3-.02.05-.31 1.06-1.02 2.1-.62.9-1.26 1.8-2.27 1.82-.99.02-1.31-.59-2.44-.59s-1.49.57-2.42.61c-.97.04-1.71-.97-2.34-1.87-1.28-1.85-2.26-5.22-.94-7.5.65-1.13 1.82-1.85 3.09-1.87.96-.02 1.86.65 2.44.65.58 0 1.68-.8 2.83-.68.48.02 1.83.19 2.7 1.46-.07.04-1.61.94-1.6 2.8M14.7 6.6c.51-.62.86-1.48.77-2.34-.74.03-1.63.49-2.16 1.11-.47.55-.89 1.43-.78 2.27.82.06 1.66-.42 2.17-1.04" />
  </svg>
);

const AndroidIcon: React.FC = () => (
  <svg width={52} height={52} viewBox="0 0 24 24" fill={colors.white}>
    <path d="M6 9v7a1 1 0 0 0 1 1h1v3.5a1.5 1.5 0 0 0 3 0V17h2v3.5a1.5 1.5 0 0 0 3 0V17h1a1 1 0 0 0 1-1V9H6M3.5 9A1.5 1.5 0 0 0 2 10.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 9m17 0a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 20.5 9M15.53 2.16l1.3-1.3a.3.3 0 0 0 0-.42.3.3 0 0 0-.42 0l-1.48 1.48A5.9 5.9 0 0 0 12 1.5c-.99 0-1.92.24-2.75.66L7.65.44a.3.3 0 0 0-.42 0 .3.3 0 0 0 0 .42l1.36 1.36A5.98 5.98 0 0 0 6 7h12a5.98 5.98 0 0 0-2.47-4.84M9.5 5.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5m5 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5" />
  </svg>
);

const WebIcon: React.FC = () => (
  <svg
    width={52}
    height={52}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colors.white}
    strokeWidth={2}
  >
    <circle cx={12} cy={12} r={9.5} />
    <ellipse cx={12} cy={12} rx={4} ry={9.5} />
    <line x1={2.5} y1={12} x2={21.5} y2={12} />
  </svg>
);

const CONFIG = {
  web: { Icon: WebIcon, top: "Abrir na", bottom: "Web App" },
  ios: { Icon: AppleIcon, top: "Descarrega na", bottom: "App Store" },
  android: { Icon: AndroidIcon, top: "Disponível no", bottom: "Google Play" },
} as const;

/** App Store / Google Play / Web App style pill. */
export const StoreBadge: React.FC<{ platform: keyof typeof CONFIG }> = ({
  platform,
}) => {
  const { Icon, top, bottom } = CONFIG[platform];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: colors.ink,
        borderRadius: 22,
        padding: "20px 26px",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <Icon />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontFamily: brandFont,
          color: colors.white,
          lineHeight: 1.1,
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 500 }}>{top}</span>
        <span style={{ fontSize: 36, fontWeight: 800 }}>{bottom}</span>
      </div>
    </div>
  );
};
