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
  // gold, textMuted, and textFaint were measured well under WCAG AA
  // contrast (2.1:1–3.1:1) against this theme's background — too faint
  // to read comfortably where they're used as real text, not just
  // decoration. Darkened each until it clears 4.5:1 against #FBF8F4.
  gold: "#8A6208",
  goldLight: "#D9B75C",

  background: "#FBF8F4",
  card: "#FFFFFF",
  border: "#ECE4D4",
  borderLight: "#F1EEE5",

  textPrimary: "#182233",
  textSecondary: "#5B6472",
  textMuted: "#636C77",
  textFaint: "#666F7A",

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
  // #69727E measured 3.66:1 against this background — under the 4.5:1
  // AA threshold for normal text. Lightened until it clears 4.5:1.
  textFaint: "#7E8894",

  verseBg: "#2A2311",
  verseText: "#E3C077",

  success: "#4FBE7E",
  danger: "#E0685A",

  white: "#FFFFFF",
  scrim: "rgba(0,0,0,0.6)",
};

/** A warm, sepia-toned palette modeled on a printed page — for
 * long stretches of reading (the Bible tab, a long note) rather than
 * quick glances at a bright screen. This is the app's default theme;
 * Light/Dark/System are still available in Settings → Appearance. */
export const readingColors: ColorPalette = {
  navy: "#5A4326",
  navyDark: "#463319",
  // gold, textMuted, and textFaint were originally lighter/warmer, but
  // measured well under WCAG AA contrast (2.4:1–3.9:1) against this
  // theme's pale paper background — too faint to actually read
  // comfortably, which defeats the point of a *reading*-focused theme.
  // Darkened all three until each clears 4.5:1 (verified against
  // #F4ECD8), while keeping textPrimary/textSecondary's already-strong
  // contrast untouched.
  gold: "#7A5116",
  goldLight: "#B98A3A",

  background: "#F4ECD8",
  card: "#FAF3E4",
  border: "#E2D5B8",
  borderLight: "#EBE0C8",

  textPrimary: "#3B2F1E",
  textSecondary: "#5C4A32",
  textMuted: "#6E5A3A",
  textFaint: "#766244",

  verseBg: "#EDE0BE",
  verseText: "#6B4A15",

  success: "#4B7A4A",
  danger: "#A6412C",

  white: "#FFFFFF",
  scrim: "rgba(59,47,30,0.42)",
};

/** Static light-mode default — kept for any spot that genuinely can't
 * reach the theme context (e.g. code that runs before React mounts).
 * Everything else should call `useColors()` instead. */
export const colors = lightColors;

export type ColorToken = keyof ColorPalette;
