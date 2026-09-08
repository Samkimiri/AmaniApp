/**
 * Type system for Amani.
 *
 * Font pairing: Newsreader (a modern, warm editorial serif) for scripture
 * and headings, and Plus Jakarta Sans (a clean, geometric-humanist sans)
 * for interface text. Both are released under the SIL Open Font License —
 * free to use, modify, and redistribute in a commercial app, no
 * attribution required, no copyright or licensing risk. This deliberately
 * avoids overused defaults (Inter, Roboto, Arial) so the app doesn't read
 * as a generic template, while staying legible and modern.
 *
 * Fonts are loaded in app/_layout.tsx via @expo-google-fonts packages.
 */
import { colors } from "./colors";

export const fontFamily = {
  serifRegular: "Newsreader_500Medium",
  serifSemibold: "Newsreader_600SemiBold",
  serifBold: "Newsreader_700Bold",
  serifItalic: "Newsreader_500Medium_Italic",
  sansRegular: "PlusJakartaSans_400Regular",
  sansMedium: "PlusJakartaSans_500Medium",
  sansSemibold: "PlusJakartaSans_600SemiBold",
  sansBold: "PlusJakartaSans_700Bold",
  sansExtraBold: "PlusJakartaSans_800ExtraBold",
} as const;

export const fontsToLoad = {
  Newsreader_500Medium: require("@expo-google-fonts/newsreader/Newsreader_500Medium.ttf"),
  Newsreader_600SemiBold: require("@expo-google-fonts/newsreader/Newsreader_600SemiBold.ttf"),
  Newsreader_700Bold: require("@expo-google-fonts/newsreader/Newsreader_700Bold.ttf"),
  Newsreader_500Medium_Italic: require("@expo-google-fonts/newsreader/Newsreader_500Medium_Italic.ttf"),
  PlusJakartaSans_400Regular: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_400Regular.ttf"),
  PlusJakartaSans_500Medium: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_500Medium.ttf"),
  PlusJakartaSans_600SemiBold: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_600SemiBold.ttf"),
  PlusJakartaSans_700Bold: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_700Bold.ttf"),
  PlusJakartaSans_800ExtraBold: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_800ExtraBold.ttf"),
};

export const textStyles = {
  displayTitle: {
    fontFamily: fontFamily.serifSemibold,
    fontSize: 25,
    color: colors.textPrimary,
  },
  screenTitle: {
    fontFamily: fontFamily.serifBold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  noteTitle: {
    fontFamily: fontFamily.serifBold,
    fontSize: 22,
    color: colors.textPrimary,
    lineHeight: 29,
  },
  verseText: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 15.5,
    color: colors.verseText,
    lineHeight: 24,
  },
  verseTextLarge: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 22,
    color: colors.textPrimary,
    lineHeight: 35,
  },
  body: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  label: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
    color: colors.textFaint,
  },
  caption: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  button: {
    fontFamily: fontFamily.sansBold,
    fontSize: 16,
    color: colors.white,
  },
} as const;
