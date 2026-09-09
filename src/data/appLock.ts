import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const STORAGE_KEY = "amani.applock.v1";

/** How long the app may sit backgrounded/hidden before it re-locks. */
export type AutoLockOption = "immediate" | "1m" | "5m" | "15m";

export const AUTO_LOCK_LABELS: Record<AutoLockOption, string> = {
  immediate: "Immediately",
  "1m": "After 1 minute",
  "5m": "After 5 minutes",
  "15m": "After 15 minutes",
};

const AUTO_LOCK_MS: Record<AutoLockOption, number> = {
  immediate: 0,
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
};

export function autoLockDelayMs(option: AutoLockOption): number {
  return AUTO_LOCK_MS[option];
}

interface AppLockSettings {
  enabled: boolean;
  salt: string;
  pinHash: string;
  autoLock: AutoLockOption;
}

const DEFAULT_SETTINGS: AppLockSettings = {
  enabled: false,
  salt: "",
  pinHash: "",
  autoLock: "immediate",
};

async function readSettings(): Promise<AppLockSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeSettings(settings: AppLockSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

async function randomSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const appLock = {
  async getSettings(): Promise<{ enabled: boolean; autoLock: AutoLockOption }> {
    const s = await readSettings();
    return { enabled: s.enabled, autoLock: s.autoLock };
  },

  /** Turn app lock on with a fresh PIN, replacing any existing one. */
  async setPin(pin: string, autoLock: AutoLockOption): Promise<void> {
    const salt = await randomSalt();
    const pinHash = await hashPin(pin, salt);
    await writeSettings({ enabled: true, salt, pinHash, autoLock });
  },

  async setAutoLock(autoLock: AutoLockOption): Promise<void> {
    const s = await readSettings();
    await writeSettings({ ...s, autoLock });
  },

  async verifyPin(pin: string): Promise<boolean> {
    const s = await readSettings();
    if (!s.enabled || !s.pinHash) return false;
    const attempt = await hashPin(pin, s.salt);
    return attempt === s.pinHash;
  },

  async disable(): Promise<void> {
    await writeSettings(DEFAULT_SETTINGS);
  },
};
