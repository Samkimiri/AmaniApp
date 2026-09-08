/**
 * Amani color tokens.
 *
 * Palette: deep navy + warm gold on a soft cream ground — chosen to feel
 * calm and dignified in a sanctuary setting rather than "app-bright".
 * These are original color choices, not sampled from any existing brand.
 */
export const colors = {
  navy: "#1F3A5F",
  navyDark: "#16283F",
  gold: "#B8860B",
  goldLight: "#D9B75C",

  background: "#FBF8F4",
  card: "#FFFFFF",
  border: "#ECE4D4",
  borderLight: "#F1EEE5",

  textPrimary: "#182233",
  textSecondary: "#5B6472",
  textMuted: "#9AA3AE",
  textFaint: "#A6AEB8",

  verseBg: "#FBF1DE",
  verseText: "#8A5A00",

  success: "#3FA66A",
  danger: "#C0392B",

  white: "#FFFFFF",
  scrim: "rgba(17,24,39,0.42)",
} as const;

export type ColorToken = keyof typeof colors;
