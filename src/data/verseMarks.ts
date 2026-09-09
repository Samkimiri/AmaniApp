import AsyncStorage from "@react-native-async-storage/async-storage";

export interface VerseMark {
  reference: string;
  text: string;
  savedAt: string;
}

async function readList(key: string): Promise<VerseMark[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeList(key: string, list: VerseMark[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

/** A small local list of marked verses (bookmarks or highlights) — no
 * account or server, same as the rest of Amani's storage. */
function createMarkStore(storageKey: string) {
  return {
    async getAll(): Promise<VerseMark[]> {
      const list = await readList(storageKey);
      return list.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    },

    async isMarked(reference: string): Promise<boolean> {
      const list = await readList(storageKey);
      return list.some((m) => m.reference === reference);
    },

    /** Adds the verse if not already marked, removes it if it is. Returns the new state. */
    async toggle(verse: { reference: string; text: string }): Promise<boolean> {
      const list = await readList(storageKey);
      const idx = list.findIndex((m) => m.reference === verse.reference);
      if (idx >= 0) {
        list.splice(idx, 1);
        await writeList(storageKey, list);
        return false;
      }
      list.push({ reference: verse.reference, text: verse.text, savedAt: new Date().toISOString() });
      await writeList(storageKey, list);
      return true;
    },

    async remove(reference: string): Promise<void> {
      const list = await readList(storageKey);
      await writeList(storageKey, list.filter((m) => m.reference !== reference));
    },
  };
}

export const bookmarks = createMarkStore("amani.bookmarks.v1");
export const highlights = createMarkStore("amani.highlights.v1");
