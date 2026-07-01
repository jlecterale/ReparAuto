/**
 * Libre Franklin is the RecarGarage brand typeface (loaded in the web app via
 * next/font). Remotion loads it through @remotion/google-fonts so text renders
 * identically during server-side rendering.
 */
import { loadFont } from "@remotion/google-fonts/LibreFranklin";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export const brandFont = fontFamily;
