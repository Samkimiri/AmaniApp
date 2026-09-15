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

interface StoredClip {
  data: ArrayBuffer;
  mimeType: string;
}

async function putWebClip(id: string, blob: Blob): Promise<void> {
  // Store the raw bytes plus the MIME type explicitly, rather than the
  // Blob object itself — some browsers' IndexedDB structured-clone of a
  // Blob doesn't reliably carry its `type` through, which then makes
  // `<audio>` refuse to play the reconstructed blob with a
  // "no supported source" error even though the bytes are fine.
  const data = await blob.arrayBuffer();
  const record: StoredClip = { data, mimeType: blob.type || "audio/webm" };
  const db = await openWebDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(WEB_STORE_NAME, "readwrite");
    tx.objectStore(WEB_STORE_NAME).put(record, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getWebClip(id: string): Promise<Blob | undefined> {
  const db = await openWebDb();
  const record = await new Promise<StoredClip | undefined>((resolve, reject) => {
    const tx = db.transaction(WEB_STORE_NAME, "readonly");
    const request = tx.objectStore(WEB_STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (!record) return undefined;
  return new Blob([record.data], { type: record.mimeType });
}

/**
 * Call this immediately after a recording finishes, with the transient
 * URI expo-av handed back, to move it into storage that actually
 * persists. Also doubles as the restore path for a backup file: `source`
 * may be a `data:` URI (from `exportRecordingAsDataUrl` below) instead of
 * a fresh recording's blob:/file: URI — both are handled the same way.
 */
export async function persistRecording(source: string, blockId: string): Promise<string> {
  if (Platform.OS === "web") {
    const blob = await fetch(source).then((r) => r.blob());
    await putWebClip(blockId, blob);
    if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    return `${WEB_URI_PREFIX}${blockId}`;
  }

  if (!NATIVE_AUDIO_DIR) return source; // no persistent directory available — best effort
  await FileSystem.makeDirectoryAsync(NATIVE_AUDIO_DIR, { intermediates: true }).catch(() => {});
  const dest = `${NATIVE_AUDIO_DIR}${blockId}.m4a`;
  if (source.startsWith("data:")) {
    const base64 = source.slice(source.indexOf(",") + 1);
    await FileSystem.writeAsStringAsync(dest, base64, { encoding: FileSystem.EncodingType.Base64 });
  } else {
    await FileSystem.copyAsync({ from: source, to: dest });
  }
  return dest;
}

/** The reverse of `persistRecording` — reads a stored clip back out as a
 * self-contained base64 data: URI, for embedding in an exported backup
 * file (which can't reference IndexedDB or the app's own file storage). */
export async function exportRecordingAsDataUrl(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    const dataUrl = await resolvePlayableUriAsDataUrl(uri);
    if (!dataUrl) throw new Error("This recording is no longer available.");
    return dataUrl;
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return `data:audio/m4a;base64,${base64}`;
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

/** Deletes a stored recording. Call this when the note (or the audio
 * block itself) is deleted, so storage doesn't accumulate orphaned clips. */
export async function deleteRecording(uri: string): Promise<void> {
  if (Platform.OS === "web") {
    if (!uri.startsWith(WEB_URI_PREFIX)) return;
    const id = uri.slice(WEB_URI_PREFIX.length);
    const db = await openWebDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(WEB_STORE_NAME, "readwrite");
      tx.objectStore(WEB_STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return;
  }
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}

/**
 * Fallback for `resolvePlayableUri`, tried only if playing the blob: URL
 * it returns fails. Some browsers refuse to load a blob: URL into an
 * <audio> element under certain conditions (e.g. it was minted outside
 * a user gesture, or a WebView-specific quirk); a base64 data: URI takes
 * a different, more universally-supported code path. Not used as the
 * primary path since it's slower and heavier for longer recordings.
 */
export async function resolvePlayableUriAsDataUrl(uri: string): Promise<string | null> {
  if (Platform.OS !== "web" || !uri.startsWith(WEB_URI_PREFIX)) return null;
  const id = uri.slice(WEB_URI_PREFIX.length);
  const blob = await getWebClip(id);
  if (!blob) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
