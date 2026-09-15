import AsyncStorage from "@react-native-async-storage/async-storage";
import { SermonNote } from "@/types/note";
import { deleteRecording } from "@/data/audioStorage";

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
    const target = notes.find((n) => n.id === id);
    if (target) {
      const audioBlocks = target.blocks.filter((b): b is Extract<typeof b, { type: "audio" }> => b.type === "audio");
      await Promise.all(audioBlocks.map((b) => deleteRecording(b.uri))).catch(() => {});
    }
    await writeAll(notes.filter((n) => n.id !== id));
  },
};
