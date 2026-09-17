import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "amani.seenHints.v1";
let cache: Set<string> | null = null;

async function loadSeen(): Promise<Set<string>> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

async function markSeen(id: string): Promise<void> {
  const seen = await loadSeen();
  seen.add(id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(seen))).catch(() => {});
}

/**
 * A one-time, dismiss-forever hint for a feature that's easy to miss —
 * swipe-to-delete, tap-a-verse-to-recolor it — identified by a stable
 * `id`. Shown once per device until dismissed, never again after.
 */
export function useHint(id: string): { visible: boolean; dismiss: () => void } {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSeen().then((seen) => {
      if (alive && !seen.has(id)) setVisible(true);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  function dismiss() {
    setVisible(false);
    markSeen(id);
  }

  return { visible, dismiss };
}
