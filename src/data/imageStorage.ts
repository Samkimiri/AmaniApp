import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { idbDelete, idbGet, idbPut, openIndexedDb } from "./indexedDb";

/**
 * Where a note's photos live.
 *
 * They used to be stored inline in the note itself, as base64 data URIs in
 * AsyncStorage. That has two hard ceilings: on Android AsyncStorage is a
 * ~6MB SQLite database for *everything*, and on web it is localStorage
 * (~5MB); a couple of photos would exceed either one, and the failure mode
 * isn't "that photo is missing" — it's that the whole notes store stops
 * being writable. So a picked photo is moved into durable storage instead
 * (IndexedDB on web, the app's own document directory on native) and the
 * note keeps only a short reference string.
 *
 * References look like `amani-image-idb:<blockId>` on web and a file path
 * on native. Anything else — a `data:` or `file:` URI from an older note, or
 * from a backup file — is passed through untouched, so existing notes and
 * downloaded backups keep working.
 */

const WEB_DB_NAME = "amani-images";
const WEB_STORE_NAME = "images";
const WEB_URI_PREFIX = "amani-image-idb:";
const NATIVE_IMAGE_DIR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}amani-images/` : null;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function extensionFor(source: string): string {
  if (/^data:image\/png/i.test(source) || /\.png($|\?)/i.test(source)) return "png";
  if (/^data:image\/gif/i.test(source) || /\.gif($|\?)/i.test(source)) return "gif";
  if (/^data:image\/webp/i.test(source) || /\.webp($|\?)/i.test(source)) return "webp";
  return "jpg";
}

function mimeFor(uri: string): string {
  if (uri.endsWith(".png")) return "image/png";
  if (uri.endsWith(".gif")) return "image/gif";
  if (uri.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/**
 * Moves a freshly picked photo into persistent storage and returns the
 * reference to keep in the note. Also doubles as the restore path for a
 * backup file: `source` may be a `data:` URI (everything exported through
 * Backup is) instead of a fresh picker result.
 */
export async function persistImage(source: string, blockId: string, mimeHint?: string): Promise<string> {
  if (Platform.OS === "web") {
    const dataUrl = source.startsWith("data:")
      ? source
      : await blobToDataUrl(await fetch(source).then((r) => r.blob()));
    const db = await openIndexedDb(WEB_DB_NAME, WEB_STORE_NAME);
    await idbPut(db, WEB_STORE_NAME, blockId, dataUrl);
    return `${WEB_URI_PREFIX}${blockId}`;
  }

  if (!NATIVE_IMAGE_DIR) return source; // no persistent directory — best effort
  await FileSystem.makeDirectoryAsync(NATIVE_IMAGE_DIR, { intermediates: true }).catch(() => {});
  const dest = `${NATIVE_IMAGE_DIR}${blockId}.${extensionFor(mimeHint ?? source)}`;
  if (source.startsWith("data:")) {
    const base64 = source.slice(source.indexOf(",") + 1);
    await FileSystem.writeAsStringAsync(dest, base64, { encoding: FileSystem.EncodingType.Base64 });
  } else {
    await FileSystem.copyAsync({ from: source, to: dest });
  }
  return dest;
}

/**
 * Turns a stored reference into something an `<Image>` can actually render.
 * Native file paths are directly displayable; a web reference has to be
 * read back out of IndexedDB first. Any other URI is returned as-is.
 */
export async function resolveImageUri(uri: string): Promise<string> {
  if (Platform.OS === "web" && uri.startsWith(WEB_URI_PREFIX)) {
    const blockId = uri.slice(WEB_URI_PREFIX.length);
    const db = await openIndexedDb(WEB_DB_NAME, WEB_STORE_NAME);
    const dataUrl = await idbGet<string>(db, WEB_STORE_NAME, blockId);
    if (!dataUrl) throw new Error("This photo is no longer available.");
    return dataUrl;
  }
  return uri;
}

/** Self-contained base64 form, for a backup file (which can't reference
 * IndexedDB or the app's own file storage) and for the PDF/print export. */
export async function exportImageAsDataUrl(uri: string): Promise<string> {
  if (uri.startsWith("data:")) return uri;
  if (Platform.OS === "web") return resolveImageUri(uri);
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return `data:${mimeFor(uri)};base64,${base64}`;
}

/** Deletes a stored photo. Called when the image block (or the note) is
 * removed, so storage doesn't accumulate orphaned images. */
export async function deleteImage(uri: string): Promise<void> {
  if (Platform.OS === "web") {
    if (!uri.startsWith(WEB_URI_PREFIX)) return;
    const blockId = uri.slice(WEB_URI_PREFIX.length);
    const db = await openIndexedDb(WEB_DB_NAME, WEB_STORE_NAME);
    await idbDelete(db, WEB_STORE_NAME, blockId);
    return;
  }
  // Only ever delete something inside Amani's own photo directory — an
  // imported backup can name any path it likes, and this must not become a
  // way to delete arbitrary files.
  if (!NATIVE_IMAGE_DIR || !uri.startsWith(NATIVE_IMAGE_DIR)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}