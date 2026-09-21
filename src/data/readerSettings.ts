import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "amani.readerSettings.v1";

export type TextSize = "small" | "medium" | "large" | "xlarge";
export type LineSpacing = "compact" | "comfortable" | "airy";
export type ReaderFont = "serif" | "sans";
export type ReaderLayout = "verses" | "paragraph";

export interface ReaderSettings {
  textSize: TextSize;
  lineSpacing: LineSpacing;
  font: ReaderFont;
  layout: ReaderLayout;
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  textSize: "medium",
  lineSpacing: "comfortable",
  font: "serif",
  layout: "verses",
};

export const TEXT_SIZE_PX: Record<TextSize, number> = { small: 16, medium: 18, large: 21, xlarge: 25 };
export const LINE_SPACING_RATIO: Record<LineSpacing, number> = { compact: 1.4, comfortable: 1.65, airy: 1.95 };

let current: ReaderSettings = DEFAULT_READER_SETTINGS;
let loaded = false;
const listeners = new Set<(s: ReaderSettings) => void>();

function isValid(value: unknown): value is Partial<ReaderSettings> {
  return !!value && typeof value === "object";
}

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) return;
    // Only accept known values, so a stale or hand-edited entry can't put
    // the reader into a state the styles below don't know how to draw.
    current = {
      textSize: parsed.textSize && parsed.textSize in TEXT_SIZE_PX ? parsed.textSize : current.textSize,
      lineSpacing:
        parsed.lineSpacing && parsed.lineSpacing in LINE_SPACING_RATIO ? parsed.lineSpacing : current.lineSpacing,
      font: parsed.font === "sans" || parsed.font === "serif" ? parsed.font : current.font,
      layout: parsed.layout === "paragraph" || parsed.layout === "verses" ? parsed.layout : current.layout,
    };
    listeners.forEach((fn) => fn(current));
  } catch {
    // unreadable settings just mean "use the defaults"
  }
}

export function updateReaderSettings(patch: Partial<ReaderSettings>): void {
  current = { ...current, ...patch };
  listeners.forEach((fn) => fn(current));
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
}

export function useReaderSettings(): ReaderSettings {
  const [settings, setSettings] = useState(current);
  useEffect(() => {
    listeners.add(setSettings);
    ensureLoaded();
    return () => {
      listeners.delete(setSettings);
    };
  }, []);
  return settings;
}
