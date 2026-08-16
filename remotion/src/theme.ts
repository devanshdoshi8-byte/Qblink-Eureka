import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const theme = {
  font: fontFamily,
  // Qblink palette
  bg: "#f4f8ff",
  bgDeep: "#eaf2ff",
  card: "#ffffff",
  text: "#0b1a33",
  muted: "#5a6b85",
  border: "#e3ecf8",
  primary: "#0a84ff",
  primaryDeep: "#0066e0",
  primaryGlow: "#56b3ff",
  accent: "#0fcf9d",
  warn: "#ff9f43",
  red: "#ef476f",
};

export const shadow = "0 30px 80px -30px rgba(10, 132, 255, 0.35), 0 8px 24px -8px rgba(11, 26, 51, 0.08)";
export const softShadow = "0 12px 40px -16px rgba(11, 26, 51, 0.18)";