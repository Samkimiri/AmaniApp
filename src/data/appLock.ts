import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const STORAGE_KEY = "amani.applock.v1";

/**
 * How many times the PIN is re-hashed before storing or comparing it.
 *
 * A 4-digit PIN is inherently low entropy — 10,000 possible values — so no
 * amount of hashing makes it strong against someone who can dump the
 * storage blob and grind it offline. What this does buy is making that
 * grind 200x more expensive than a single SHA-256 pass, at the cost of a
 * few hundred ms on unlock. The protection against the *realistic* threat
 * (someone who has picked up the unlocked phone) is the attempt limit
 * below, not the hash.
 */
const HASH_ITERATIONS = 200;

/** Marks hashes produced with the stretching above. Records written before
 * it existed carry no version; those are verified the old way once and then
 * silently upgraded to the new form. */
const HASH_VERSION = 2;

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

/**
 * Wait imposed after consecutive wrong PINs. Indexed by the number of
 * failures so far: nothing until the fifth, so a couple of mistypes are
 * harmless, then 15s, 1m, 5m, 15m. Persisted with the settings, so
 * force-quitting the app doesn't reset the count.
 */
const LOCKOUT_SCHEDULE_MS = [0, 0, 0, 0, 0, 15_000, 60_000, 5 * 60_000, 15 * 60_000];

interface AppLockSettings {
  enabled: boolean;
  salt: string;
  pinHash: string;
  /** Absent on records written before hash stretching was added. */
  hashVersion?: number;
  autoLock: AutoLockOption;
  failedAttempts?: number;
  /** Epoch ms before which no attempt is accepted. 0/absent = no lockout. */
  lockedUntil?: number;
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

async function hashPin(pin: string, salt: string, iterations: number): Promise<string> {
  let value = `${salt}:${pin}`;
  for (let i = 0; i < iterations; i++) {
    value = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
  }
  return value;
}

async function randomSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function lockoutFor(failedAttempts: number): number {
  return LOCKOUT_SCHEDULE_MS[Math.min(failedAttempts, LOCKOUT_SCHEDULE_MS.length - 1)];
}

/** Milliseconds left before another PIN attempt is accepted, or 0. */
export async function getLockoutRemainingMs(): Promise<number> {
  const s = await readSettings();
  if (!s.lockedUntil) return 0;
  return Math.max(0, s.lockedUntil - Date.now());
}

export const appLock = {
  async getSettings(): Promise<{ enabled: boolean; autoLock: AutoLockOption }> {
    const s = await readSettings();
    return { enabled: s.enabled, autoLock: s.autoLock };
  },

  /** Turn app lock on with a fresh PIN, replacing any existing one. */
  async setPin(pin: string, autoLock: AutoLockOption): Promise<void> {
    const salt = await randomSalt();
    const pinHash = await hashPin(pin, salt, HASH_ITERATIONS);
    await writeSettings({
      enabled: true,
      salt,
      pinHash,
      hashVersion: HASH_VERSION,
      autoLock,
      failedAttempts: 0,
      lockedUntil: 0,
    });
  },

  async setAutoLock(autoLock: AutoLockOption): Promise<void> {
    const s = await readSettings();
    await writeSettings({ ...s, autoLock });
  },

  /** Checks a PIN, and enforces the failed-attempt lockout either way.
   * Returns false (never throwing) while locked out, so callers can just
   * show "wrong PIN" and, if they want, how long is left. */
  async verifyPin(pin: string): Promise<boolean> {
    const s = await readSettings();
    if (!s.enabled || !s.pinHash) return false;

    const now = Date.now();
    if (s.lockedUntil && s.lockedUntil > now) return false;

    const attempt = await hashPin(pin, s.salt, s.hashVersion === HASH_VERSION ? HASH_ITERATIONS : 1);
    if (attempt === s.pinHash) {
      if (s.hashVersion !== HASH_VERSION) {
        // Quietly upgrade a legacy single-pass hash now that the PIN is known.
        const pinHash = await hashPin(pin, s.salt, HASH_ITERATIONS);
        await writeSettings({ ...s, pinHash, hashVersion: HASH_VERSION, failedAttempts: 0, lockedUntil: 0 });
      } else if (s.failedAttempts || s.lockedUntil) {
        await writeSettings({ ...s, failedAttempts: 0, lockedUntil: 0 });
      }
      return true;
    }

    const failedAttempts = (s.failedAttempts ?? 0) + 1;
    await writeSettings({ ...s, failedAttempts, lockedUntil: now + lockoutFor(failedAttempts) });
    return false;
  },

  async disable(): Promise<void> {
    await writeSettings(DEFAULT_SETTINGS);
  },
};
