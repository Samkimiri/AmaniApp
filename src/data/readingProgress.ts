import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "amani.readingProgress.v1";

export interface ReadingPosition {
  book: string;
  chapter: number;
}

const listeners = new Set<(p: ReadingPosition | null) => void>();

async function load(): Promise<ReadingPosition | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.book === "string" && Number.isFinite(parsed?.chapter)) return parsed;
  } catch {
    // treat unreadable data as "no progress yet"
  }
  return null;
}

/** One-shot read of the last saved position, for callers that just need
 * the value once (e.g. deciding what to resume to) rather than a
 * subscription. */
export async function getReadingPosition(): Promise<ReadingPosition | null> {
  return load();
}

/** Remembers where the reader left off, so "Continue reading" can drop
 * someone straight back into the chapter they were on. Local only. */
export async function saveReadingPosition(position: ReadingPosition): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(position)).catch(() => {});
  listeners.forEach((fn) => fn(position));
}

export function useReadingPosition(): ReadingPosition | null {
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const refresh = useCallback(() => {
    load().then(setPosition);
  }, []);

  useEffect(() => {
    refresh();
    listeners.add(setPosition);
    return () => {
      listeners.delete(setPosition);
    };
  }, [refresh]);

  return position;
}
