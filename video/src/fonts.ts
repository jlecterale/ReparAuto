/**
 * Libre Franklin is the RecarGarage brand typeface (loaded in the web app via
 * next/font). The woff2 files live in `public/fonts/` so renders never depend
 * on the network (Google Fonts is unreachable from sandboxed CI/render boxes).
 */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const family = "Libre Franklin";

const weights = ["400", "600", "700", "800"] as const;

void Promise.all(
  weights.map((weight) =>
    loadFont({
      family,
      url: staticFile(`fonts/LibreFranklin-${weight}.woff2`),
      weight,
    }),
  ),
);

export const brandFont = family;
