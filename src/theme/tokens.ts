import { Platform, ViewStyle } from "react-native";
import { ColorPalette } from "./colors";

/**
 * Design tokens — the small set of numbers that keep Amani's surfaces
 * feeling like one system. Components reach for these instead of hardcoding
 * a radius or a padding, so a tweak here lands everywhere at once.
 */

/** Corner radii. `pill` is for fully-rounded chips and badges. */
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** A 4pt spacing scale, for padding / margins / gaps. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export interface Shadows {
  none: ViewStyle;
  sm: ViewStyle;
  md: ViewStyle;
  lg: ViewStyle;
  /** Cast upward, for bottom bars and sheets sitting at the edge of the screen. */
  top: ViewStyle;
}

/** #RRGGBB (or #RGB) + alpha -> an `rgba()` string. Web box-shadows need
 * the alpha baked into the color. */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Soft, warm elevation. Web gets a real `box-shadow`; native gets the
 * classic `shadow*` props plus Android's `elevation`, so depth looks the
 * same everywhere. The shadow is tinted with the palette's own
 * `shadowTint` (see colors.ts) so it reads as part of the same warm
 * scheme rather than a neutral grey laid over it.
 */
export function makeShadows(palette: ColorPalette): Shadows {
  const tint = palette.shadowTint;
  function level(offsetY: number, blur: number, opacity: number): ViewStyle {
    return Platform.select({
      web: { boxShadow: `0px ${offsetY}px ${blur}px ${hexToRgba(tint, opacity)}` } as ViewStyle,
      default: {
        shadowColor: tint,
        shadowOpacity: opacity,
        shadowRadius: blur,
        shadowOffset: { width: 0, height: offsetY },
        elevation: Math.max(1, Math.round(blur / 3)),
      } as ViewStyle,
    })!;
  }
  return {
    none: {},
    sm: level(2, 8, 0.06),
    md: level(6, 16, 0.09),
    lg: level(12, 28, 0.13),
    top: level(-6, 16, 0.08),
  };
}
