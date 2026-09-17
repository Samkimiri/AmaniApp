/**
 * Amani color tokens.
 *
 * Palette: deep navy + warm gold on a soft cream ground (light) or a warm
 * charcoal ground (dark) — chosen to feel calm and dignified in a
 * sanctuary setting rather than "app-bright". These are original color
 * choices, not sampled from any existing brand.
 *
 * Every screen reads colors through `useColors()` (src/context/ThemeContext.tsx)
 * rather than importing `colors` directly, so it re-renders with the right
 * palette when the user switches theme. The two palettes below share
 * exactly the same keys so a component never needs to know which one is
 * active.
 */
export interface ColorPalette {
  navy: string;
  navyDark: string;
  gold: string;
  goldLight: string;

  background: string;
  card: string;
  border: string;
  borderLight: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;

  verseBg: string;
  verseText: string;

  success: string;
  danger: string;

  white: string;
  scrim: string;
}

export const lightColors: ColorPalette = {
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
};

export const darkColors: ColorPalette = {
  navy: "#6B93C4",
  navyDark: "#4A6D99",
  gold: "#D9B75C",
  goldLight: "#F0D68A",

  background: "#12181F",
  card: "#1C2530",
  border: "#2C3846",
  borderLight: "#242E3A",

  textPrimary: "#F1F0EC",
  textSecondary: "#B8C0CC",
  textMuted: "#8891A0",
  textFaint: "#69727E",

  verseBg: "#2A2311",
  verseText: "#E3C077",

  success: "#4FBE7E",
  danger: "#E0685A",

  white: "#FFFFFF",
  scrim: "rgba(0,0,0,0.6)",
};

/** Static light-mode default — kept for any spot that genuinely can't
 * reach the theme context (e.g. code that runs before React mounts).
 * Everything else should call `useColors()` instead. */
export const colors = lightColors;

export type ColorToken = keyof ColorPalette;
