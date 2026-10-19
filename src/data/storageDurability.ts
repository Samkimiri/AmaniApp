import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { idbGet, idbPut, openIndexedDb } from "./indexedDb";

/**
 * Storage durability & dual-engine mirroring for Amani.
 *
 * 1. Browser Persistent Storage (`navigator.storage.persist()`):
 *    Mobile browsers (Safari on iOS, Chrome on Android) can evict standard
 *    site storage if the device runs low on space. Calling `persist()` asks
 *    the browser to mark this origin's storage as non-evictable.
 *
 * 2. Secondary Engine Mirror (`IndexedDB` on Web, Document Directory on Native):
 *    On Web, AsyncStorage is backed by `window.localStorage` (~5 MB ceiling).
 *    Mirroring the notes payload into `IndexedDB` (which has a much larger
 *    quota and separate storage bucket) ensures that even if `localStorage`
 *    hits its quota or is cleared, `notesStore` can self-heal from IndexedDB.
 */

const MIRROR_DB_NAME = "amani-notes-mirror";
const MIRROR_STORE_NAME = "snapshots";
const MIRROR_KEY = "latest";
const NATIVE_MIRROR_FILE = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}amani-notes-mirror.json`
  : null;

export interface StorageHealth {
  /** True when the browser has granted persistent (non-evictable) storage,
   * or on native where app document storage is always persistent. */
  persisted: boolean;
  /** True when the environment supports querying/requesting persistence. */
  supported: boolean;
  /** Bytes currently used across the origin (IndexedDB + Cache + localStorage). */
  usageBytes?: number;
  /** Total quota bytes granted to the origin by the browser. */
  quotaBytes?: number;
  /** True when the secondary IndexedDB / file mirror is available. */
  mirrorAvailable: boolean;
}

function hasWebIndexedDb(): boolean {
  return Platform.OS === "web" && typeof indexedDB !== "undefined";
}

function hasNativeMirrorFile(): boolean {
  return (
    Platform.OS !== "web" &&
    process.env.NODE_ENV !== "test" &&
    typeof NATIVE_MIRROR_FILE === "string" &&
    NATIVE_MIRROR_FILE.length > 0
  );
}

/**
 * Requests persistent (non-evictable) storage from the browser on launch,
 * and returns the current storage health snapshot.
 */
export async function requestPersistentStorage(): Promise<StorageHealth> {
  if (Platform.OS !== "web") {
    return {
      persisted: true,
      supported: true,
      mirrorAvailable: hasNativeMirrorFile(),
    };
  }

  let persisted = false;
  let supported = false;
  let usageBytes: number | undefined;
  let quotaBytes: number | undefined;

  try {
    if (typeof navigator !== "undefined" && navigator.storage) {
      supported = typeof navigator.storage.persist === "function";
      if (typeof navigator.storage.persisted === "function") {
        persisted = await navigator.storage.persisted();
      }
      if (!persisted && typeof navigator.storage.persist === "function") {
        persisted = await navigator.storage.persist();
      }
      if (typeof navigator.storage.estimate === "function") {
        const est = await navigator.storage.estimate();
        usageBytes = est.usage;
        quotaBytes = est.quota;
      }
    }
  } catch {
    // Ignore errors in restricted webviews or private browsing modes
  }

  return {
    persisted,
    supported,
    usageBytes,
    quotaBytes,
    mirrorAvailable: hasWebIndexedDb(),
  };
}

/**
 * Reads the current storage health without triggering a permission prompt.
 */
export async function getStorageHealth(): Promise<StorageHealth> {
  if (Platform.OS !== "web") {
    return {
      persisted: true,
      supported: true,
      mirrorAvailable: hasNativeMirrorFile(),
    };
  }

  let persisted = false;
  let supported = false;
  let usageBytes: number | undefined;
  let quotaBytes: number | undefined;

  try {
    if (typeof navigator !== "undefined" && navigator.storage) {
      supported = typeof navigator.storage.persisted === "function";
      if (supported) {
        persisted = await navigator.storage.persisted();
      }
      if (typeof navigator.storage.estimate === "function") {
        const est = await navigator.storage.estimate();
        usageBytes = est.usage;
        quotaBytes = est.quota;
      }
    }
  } catch {
    // Ignore errors
  }

  return {
    persisted,
    supported,
    usageBytes,
    quotaBytes,
    mirrorAvailable: hasWebIndexedDb(),
  };
}

/**
 * Writes a redundant copy of the serialized notes array into IndexedDB (web)
 * or the app's document directory (native). Best-effort: never throws.
 */
export async function writeNotesMirror(payload: string): Promise<void> {
  try {
    if (hasWebIndexedDb()) {
      const db = await openIndexedDb(MIRROR_DB_NAME, MIRROR_STORE_NAME);
      await idbPut(db, MIRROR_STORE_NAME, MIRROR_KEY, payload);
      return;
    }
    if (hasNativeMirrorFile() && NATIVE_MIRROR_FILE) {
      await FileSystem.writeAsStringAsync(NATIVE_MIRROR_FILE, payload, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  } catch {
    // Mirror is a safety net — never fail the caller
  }
}

/**
 * Reads the redundant notes snapshot from IndexedDB (web) or document
 * directory (native) when primary AsyncStorage is unreadable or missing.
 */
export async function readNotesMirror(): Promise<string | null> {
  try {
    if (hasWebIndexedDb()) {
      const db = await openIndexedDb(MIRROR_DB_NAME, MIRROR_STORE_NAME);
      const val = await idbGet<string>(db, MIRROR_STORE_NAME, MIRROR_KEY);
      return typeof val === "string" ? val : null;
    }
    if (hasNativeMirrorFile() && NATIVE_MIRROR_FILE) {
      const info = await FileSystem.getInfoAsync(NATIVE_MIRROR_FILE);
      if (!info.exists) return null;
      return await FileSystem.readAsStringAsync(NATIVE_MIRROR_FILE, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  } catch {
    // Ignore mirror read errors
  }
  return null;
}

