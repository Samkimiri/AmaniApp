import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { notesStore } from "./notesStore";
import { persistRecording, exportRecordingAsDataUrl } from "./audioStorage";
import { SermonNote } from "@/types/note";

/**
 * A full local backup of every note — the fix for the biggest risk of an
 * account-free, on-device-only app: lose the phone or clear site data
 * and everything is gone with no way to recover it. This lets someone
 * download one file with everything in it, and restore from it later on
 * this device or a new one.
 *
 * Photos are already safe to include as-is: expo-image-picker's web
 * implementation hands back base64 data: URIs already, and native image
 * URIs point at files that get bundled below like audio does. Audio is
 * the one block type that needs converting on the way out (it's stored
 * in IndexedDB / the app's own file storage, not something a plain JSON
 * file can reference) and reconstructing on the way in.
 */

const BACKUP_APP_ID = "amani-backup";
const BACKUP_VERSION = 1;

interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  notes: SermonNote[];
}

async function embedAudioForExport(note: SermonNote): Promise<SermonNote> {
  const blocks = await Promise.all(
    note.blocks.map(async (block) => {
      if (block.type !== "audio") return block;
      try {
        const dataUri = await exportRecordingAsDataUrl(block.uri);
        return { ...block, uri: dataUri };
      } catch {
        return block; // best effort — keep the note, drop just this clip
      }
    })
  );
  return { ...note, blocks };
}

export async function buildBackupJson(): Promise<string> {
  const notes = await notesStore.getAll();
  const withEmbeddedAudio = await Promise.all(notes.map(embedAudioForExport));
  const file: BackupFile = {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    notes: withEmbeddedAudio,
  };
  return JSON.stringify(file, null, 2);
}

function backupFilename(): string {
  return `amani-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

/** Downloads (web) or opens the share sheet for (native) a single JSON
 * file containing every note, photo, and recording on this device. */
export async function exportBackup(): Promise<void> {
  const json = await buildBackupJson();
  const filename = backupFilename();

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const dest = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(dest, json);
  await Sharing.shareAsync(dest, { mimeType: "application/json", UTI: "public.json" });
}

/** Opens the system file picker and returns the chosen file's text
 * content, or null if the user canceled. */
export async function pickBackupJson(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ["application/json", "*/*"] });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (Platform.OS === "web" && asset.file) {
    return asset.file.text();
  }
  return FileSystem.readAsStringAsync(asset.uri);
}

function isBackupFile(value: unknown): value is BackupFile {
  return (
    !!value &&
    typeof value === "object" &&
    (value as BackupFile).app === BACKUP_APP_ID &&
    Array.isArray((value as BackupFile).notes)
  );
}

/**
 * Restores every note from a previously exported backup's JSON text.
 * Notes are saved by id, so restoring the same backup twice (or onto a
 * device that already has some of those notes) overwrites rather than
 * duplicates; anything else already on the device is left untouched.
 *
 * Each note is processed independently — one malformed note (a hand-edited
 * file, a partially-corrupted export) shouldn't abort the whole restore
 * and leave the user unsure whether anything before it actually saved.
 */
export async function importBackup(jsonText: string): Promise<{ imported: number; failed: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!isBackupFile(parsed)) {
    throw new Error("That doesn't look like an Amani backup file.");
  }

  let imported = 0;
  let failed = 0;
  for (const note of parsed.notes) {
    try {
      const blocks = await Promise.all(
        (note.blocks ?? []).map(async (block) => {
          if (block.type !== "audio" || !block.uri.startsWith("data:")) return block;
          try {
            const persistedUri = await persistRecording(block.uri, block.id);
            return { ...block, uri: persistedUri };
          } catch {
            return block;
          }
        })
      );
      await notesStore.save({ ...note, blocks });
      imported++;
    } catch {
      failed++;
    }
  }
  return { imported, failed };
}
