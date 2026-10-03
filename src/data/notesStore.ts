import AsyncStorage from "@react-native-async-storage/async-storage";
import { NoteBlock, SermonNote } from "@/types/note";
import { deleteRecording } from "@/data/audioStorage";
import { deleteImage } from "@/data/imageStorage";
import { mergeNotes, needsRepair, normalizeNote, salvageNotes } from "@/data/notesRecovery";

const STORAGE_KEY = "amani.notes.v1";
/** The last payload we could read back in full. If the live key is ever
 * unreadable, this is what "put the notes back the way they were" resolves
 * to — so it is only ever moved forward after a successful live write. */
const BACKUP_KEY = "amani.notes.backup.v1";
/** An unreadable live payload, kept verbatim. Nothing is allowed to write
 * the live key from a bad read, so the raw bytes survive to be salvaged. */
const QUARANTINE_KEY = "amani.notes.quarantine.v1";

interface ParsedNotes {
  notes: SermonNote[];
  /** The stored payload no longer matches the current format and should be
   * rewritten, so the upgrade is persisted instead of reapplied each read. */
  repaired: boolean;
}

/** Parses a payload we expect to be a JSON array of notes. Returns null when
 * it can't be read as one — which every caller must treat as "recover",
 * never as "the user has no notes". That distinction is the whole point:
 * conflating the two is what let an update wipe a device's notes, because
 * the next save wrote the empty read back over everything. */
function parseStoredNotes(raw: string | null): ParsedNotes | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as any).notes)
      ? (parsed as any).notes
      : null;
  if (!list) return null;
  return { notes: list.map(normalizeNote), repaired: needsRepair(list) };
}

async function readRaw(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Keeps the exact bytes of a payload we couldn't read, so a later attempt
 * can still look inside it. Only ever touches the quarantine key. */
async function quarantine(raw: string): Promise<void> {
  try {
    if ((await AsyncStorage.getItem(QUARANTINE_KEY)) === raw) return;
    await AsyncStorage.setItem(QUARANTINE_KEY, raw);
  } catch {
    // The quarantine is a safety net, not a requirement.
  }
}

/**
 * Reads every note. A payload we can't parse is never allowed to *look*
 * like an empty one: it's quarantined, and every note that can still be
 * recovered — from the damaged text itself and from the last known-good
 * snapshot — is merged back in, so notes saved by an earlier version come
 * back on their own rather than being silently dropped.
 */
async function readAll(): Promise<SermonNote[]> {
  const raw = await readRaw();
  if (!raw) return []; // nothing has ever been saved on this device

  const parsed = parseStoredNotes(raw);
  if (parsed) {
    if (parsed.repaired) {
      // Persist the upgraded shape once, so notes carried over from an
      // older format aren't re-invented (with fresh ids) on every read.
      await writeAll(parsed.notes).catch(() => {});
    }
    return parsed.notes;
  }

  await quarantine(raw);
  const backupRaw = await AsyncStorage.getItem(BACKUP_KEY).catch(() => null);
  const recovered = mergeNotes(salvageNotes(raw), salvageNotes(backupRaw));
  // Make the recovery durable, so the damaged payload isn't re-salvaged on
  // every load. If nothing at all could be recovered we deliberately leave
  // the live key alone rather than overwriting it with the empty result.
  if (recovered.length > 0) await writeAll(recovered).catch(() => {});
  return recovered;
}

async function writeAll(notes: SermonNote[]): Promise<void> {
  const payload = JSON.stringify(notes);
  await AsyncStorage.setItem(STORAGE_KEY, payload);
  // Move the known-good marker forward only once the live write succeeded.
  await AsyncStorage.setItem(BACKUP_KEY, payload).catch(() => {});
}

/**
 * Every write is a read-modify-write of the whole array, and several
 * callers can fire at once — the editor's debounced autosave, its `goBack`,
 * and a delete from the notes list. Without serializing them, two
 * interleaved calls could read the same snapshot and the later write would
 * silently drop the other's change. Chaining each mutation onto the
 * previous one costs nothing at this scale and removes the race entirely.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function mutate<T>(operation: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(operation, operation);
  // Keep the chain alive even if this operation rejects, so one failed
  // write can't wedge every later one.
  writeQueue = next.catch(() => undefined);
  return next;
}

/** Drops the stored audio clip or photo behind a single block. Best
 * effort — cleaning up storage must never be able to break the edit that
 * removed the block. */
export async function deleteBlockMedia(block: NoteBlock): Promise<void> {
  if (block.type === "audio") await deleteRecording(block.uri).catch(() => {});
  else if (block.type === "image") await deleteImage(block.uri).catch(() => {});
}

/** Drops every clip and photo a deleted note owned, so storage doesn't
 * accumulate orphans. */
export async function deleteNoteMedia(note: SermonNote): Promise<void> {
  await Promise.all((note.blocks ?? []).map(deleteBlockMedia)).catch(() => {});
}

export const notesStore = {
  async getAll(): Promise<SermonNote[]> {
    const notes = await readAll();
    return notes.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  },

  async getById(id: string): Promise<SermonNote | undefined> {
    const notes = await readAll();
    return notes.find((n) => n.id === id);
  },

  save(note: SermonNote): Promise<void> {
    return mutate(async () => {
      const notes = await readAll();
      const idx = notes.findIndex((n) => n.id === note.id);
      if (idx >= 0) {
        notes[idx] = note;
      } else {
        notes.push(note);
      }
      await writeAll(notes);
    });
  },

  remove(id: string): Promise<void> {
    return mutate(async () => {
      const notes = await readAll();
      const target = notes.find((n) => n.id === id);
      if (target) await deleteNoteMedia(target);
      await writeAll(notes.filter((n) => n.id !== id));
    });
  },
};
