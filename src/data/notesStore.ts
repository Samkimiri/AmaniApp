import AsyncStorage from "@react-native-async-storage/async-storage";
import { SermonNote } from "@/types/note";

const STORAGE_KEY = "amani.notes.v1";

async function readAll(): Promise<SermonNote[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt or missing local data shouldn't crash the app — start fresh.
    return [];
  }
}

async function writeAll(notes: SermonNote[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export const notesStore = {
  async getAll(): Promise<SermonNote[]> {
    const notes = await readAll();
    return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getById(id: string): Promise<SermonNote | undefined> {
    const notes = await readAll();
    return notes.find((n) => n.id === id);
  },

  async save(note: SermonNote): Promise<void> {
    const notes = await readAll();
    const idx = notes.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
      notes[idx] = note;
    } else {
      notes.push(note);
    }
    await writeAll(notes);
  },

  async remove(id: string): Promise<void> {
    const notes = await readAll();
    await writeAll(notes.filter((n) => n.id !== id));
  },
};
