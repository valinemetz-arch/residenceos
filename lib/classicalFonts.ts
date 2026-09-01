import { Cormorant_Garamond, Lora } from "next/font/google";

// Self-hosted via next/font so these only load where the Classical design
// system is actually used (/app, /contractor) - `variable` mode exposes a
// CSS custom property instead of forcing a global font-family, which is
// what lets `.classical` in globals.css scope the fonts to just those
// sections without touching the rest of the app's typography.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-classical-heading",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-classical-body",
  display: "swap",
});

export const classicalFontVariables = `${cormorantGaramond.variable} ${lora.variable}`;
