import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ColorPalette, darkColors, lightColors, readingColors } from "@/theme/colors";
import { makeTextStyles } from "@/theme/typography";

export type ThemeMode = "light" | "dark" | "reading" | "system";

const STORAGE_KEY = "amani.theme.v1";

interface ThemeContextValue {
  colors: ColorPalette;
  scheme: "light" | "dark";
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** App-wide theme: Light (the default — a plain white, standard
 * appearance), Reading (a warm, paper-like palette for long stretches of
 * Bible/note reading), Dark, or following the device's system light/dark
 * setting. Persisted locally, same as every other Amani setting — no
 * account, nothing leaves the device. Renders with the default
 * immediately and swaps in the saved preference the moment it's read, so
 * there's no blank flash while AsyncStorage resolves. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "reading" || saved === "system") setModeState(saved);
    });
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }

  const resolved: "light" | "dark" | "reading" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  // Reading's pale paper background reads as a "light" surface for
  // status-bar-contrast purposes (dark status bar text/icons).
  const scheme: "light" | "dark" = resolved === "dark" ? "dark" : "light";
  const colors = resolved === "dark" ? darkColors : resolved === "reading" ? readingColors : lightColors;

  const value = useMemo(() => ({ colors, scheme, mode, setMode }), [colors, scheme, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/** Shorthand for the common case of just needing the active palette. */
export function useColors(): ColorPalette {
  return useTheme().colors;
}

/** `textStyles` from theme/typography, recomputed for the active palette. */
export function useTextStyles() {
  const colors = useColors();
  return useMemo(() => makeTextStyles(colors), [colors]);
}
