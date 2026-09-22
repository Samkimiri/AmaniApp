import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "amani.chaptersRead.v1";

function key(book: string, chapter: number): string {
  return `${book}|${chapter}`;
}

async function readSet(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/** Records that a chapter has been opened in the reader, so the stats
 * screen can show a real "chapters read" count. A plain de-duplicated set
 * keyed by book+chapter — re-reading a chapter doesn't inflate the count. */
export async function markChapterRead(book: string, chapter: number): Promise<void> {
  const set = await readSet();
  const k = key(book, chapter);
  if (set.has(k)) return;
  set.add(k);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set))).catch(() => {});
}

export async function getChaptersReadCount(): Promise<number> {
  return (await readSet()).size;
}
