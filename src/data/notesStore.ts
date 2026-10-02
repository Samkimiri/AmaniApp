import AsyncStorage from "@react-native-async-storage/async-storage";
import { newId, NoteBlock, SermonNote } from "@/types/note";
import { deleteRecording } from "@/data/audioStorage";
import { deleteImage } from "@/data/imageStorage";

const STORAGE_KEY = "amani.notes.v1";

function normalizeNote(n: any): SermonNote {
  const createdAt = typeof n?.createdAt === "string" ? n.createdAt : new Date().toISOString();
  const updatedAt = typeof n?.updatedAt === "string" ? n.updatedAt : createdAt;
  return {
    id: typeof n?.id === "string" ? n.id : newId(),
    title: typeof n?.title === "string" ? n.title : "",
    church: typeof n?.church === "string" ? n.church : "",
    preacher: typeof n?.preacher === "string" ? n.preacher : "",
    tags: Array.isArray(n?.tags) ? n.tags : [],
    date: typeof n?.date === "string" ? n.date : "",
    blocks: Array.isArray(n?.blocks) ? n.blocks : [],
    createdAt,
    updatedAt,
  };
}

async function readAll(): Promise<SermonNote[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeNote);
  } catch {
    // Corrupt or missing local data shouldn't crash the app — start fresh.
    return [];
  }
}

async function writeAll(notes: SermonNote[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
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
