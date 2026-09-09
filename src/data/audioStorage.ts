import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

/**
 * Where expo-av actually writes a fresh recording is NOT guaranteed to
 * survive the app being closed and reopened:
 *  - On web, `Audio.Recording` hands back a `blob:` URL, which is only
 *    valid for the lifetime of the page that created it — reload the
 *    PWA (or reopen it from the home screen) and every previously
 *    recorded clip's URL is permanently dead.
 *  - On iOS/Android, expo-av records into a cache/tmp directory that the
 *    OS is free to clear between launches.
 *
 * These functions move a fresh recording into storage that actually
 * persists (IndexedDB on web, the app's document directory on native),
 * and resolve a stored reference back into something playable.
 */

const WEB_DB_NAME = "amani-audio";
const WEB_STORE_NAME = "clips";
const WEB_URI_PREFIX = "amani-audio-idb:";
const NATIVE_AUDIO_DIR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}amani-audio/` : null;

function openWebDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WEB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(WEB_STORE_NAME)) {
        request.result.createObjectStore(WEB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putWebClip(id: string, blob: Blob): Promise<void> {
  const db = await openWebDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(WEB_STORE_NAME, "readwrite");
    tx.objectStore(WEB_STORE_NAME).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getWebClip(id: string): Promise<Blob | undefined> {
  const db = await openWebDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WEB_STORE_NAME, "readonly");
    const request = tx.objectStore(WEB_STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Call this immediately after a recording finishes, with the transient
 * URI expo-av handed back. Returns a URI that's safe to store in a note
 * and reopen in a future session.
 */
export async function persistRecording(tempUri: string, blockId: string): Promise<string> {
  if (Platform.OS === "web") {
    const blob = await fetch(tempUri).then((r) => r.blob());
    await putWebClip(blockId, blob);
    if (tempUri.startsWith("blob:")) URL.revokeObjectURL(tempUri);
    return `${WEB_URI_PREFIX}${blockId}`;
  }

  if (!NATIVE_AUDIO_DIR) return tempUri; // no persistent directory available — best effort
  await FileSystem.makeDirectoryAsync(NATIVE_AUDIO_DIR, { intermediates: true }).catch(() => {});
  const dest = `${NATIVE_AUDIO_DIR}${blockId}.m4a`;
  await FileSystem.copyAsync({ from: tempUri, to: dest });
  return dest;
}

/**
 * Call this right before playing a stored audio block. On native the URI
 * is already directly playable; on web a stored reference needs a fresh
 * blob: URL minted for this session.
 */
export async function resolvePlayableUri(uri: string): Promise<string> {
  if (Platform.OS === "web" && uri.startsWith(WEB_URI_PREFIX)) {
    const id = uri.slice(WEB_URI_PREFIX.length);
    const blob = await getWebClip(id);
    if (!blob) throw new Error("This recording is no longer available.");
    return URL.createObjectURL(blob);
  }
  return uri;
}
