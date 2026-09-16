/**
 * Shared color palette for verse highlights (Bible tab) and scripture
 * callout backgrounds (note editor, PDF export) — the same six colors
 * are offered in both places so a color means the same thing everywhere
 * in the app. Each color is a soft, low-saturation fill (never a bright
 * "highlighter" tone) to match Amani's calm, print-like palette.
 */
export interface HighlightColor {
  id: string;
  name: string;
  /** Soft background fill behind the verse text. */
  background: string;
  /** Deeper accent used for the left border and reference label. */
  accent: string;
  /** Body text color, chosen for contrast against `background`. */
  text: string;
}

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  { id: "gold", name: "Gold", background: "#FBF1DE", accent: "#8A5A00", text: "#4A3B12" },
  { id: "rose", name: "Rose", background: "#FBE7E6", accent: "#A6423A", text: "#4A2320" },
  { id: "sky", name: "Sky", background: "#E4EEFB", accent: "#2A5A8A", text: "#1C2E40" },
  { id: "sage", name: "Sage", background: "#E7F0E4", accent: "#3F6B3A", text: "#233A20" },
  { id: "lavender", name: "Lavender", background: "#EEE6F6", accent: "#6A4F94", text: "#33263F" },
  { id: "sand", name: "Sand", background: "#F2ECE2", accent: "#7A6A45", text: "#3A3020" },
];

export const DEFAULT_HIGHLIGHT_COLOR = "gold";

export function getHighlightColor(id?: string): HighlightColor {
  return HIGHLIGHT_COLORS.find((c) => c.id === id) ?? HIGHLIGHT_COLORS[0];
}
