import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ColorPalette, darkColors, lightColors } from "@/theme/colors";
import { makeTextStyles } from "@/theme/typography";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "amani.theme.v1";

interface ThemeContextValue {
  colors: ColorPalette;
  scheme: "light" | "dark";
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** App-wide theme: light, dark, or following the device's system setting
 * (the default). Persisted locally, same as every other Amani setting —
 * no account, nothing leaves the device. Renders with the system scheme
 * immediately and swaps in the saved preference the moment it's read, so
 * there's no blank flash while AsyncStorage resolves. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") setModeState(saved);
    });
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }

  const scheme: "light" | "dark" = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  const colors = scheme === "dark" ? darkColors : lightColors;

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
