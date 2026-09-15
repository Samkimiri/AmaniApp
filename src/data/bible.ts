/**
 * Offline scripture engine, with two bundled public-domain translations.
 *
 * - **KJV** (King James Version, 1611) — the original translation this
 *   app shipped with. Imported directly as a JS module so it's available
 *   instantly with no loading state, exactly as before.
 * - **WEB** (World English Bible) — a modern-English public-domain
 *   translation (explicitly released copyright-free by its translators),
 *   converted from the public JSON dataset at
 *   github.com/TehShrike/world-english-bible. A few verse numbers in
 *   that dataset are intentionally blank — well-documented manuscript
 *   variants (e.g. Acts 8:37, Romans 16:25-27) that most modern
 *   translations footnote rather than silently drop; the bundled file
 *   stores an explanatory note directly in those verse slots instead of
 *   leaving them blank.
 *
 * The WEB file is loaded lazily as a binary *asset* (via expo-asset)
 * rather than a second `import` — two ~4MB translations both inlined as
 * JS object literals crashes the Hermes bytecode compiler on Android
 * release builds (verified directly: one inlined translation builds
 * fine, two does not). Loading it as an asset keeps it out of the JS
 * bundle Hermes has to compile; it's fetched once, the first time
 * someone switches to it, and cached in memory after that. See
 * metro.config.js for the matching resolver config.
 *
 * Both still work with zero network connection once loaded — this is
 * about *bundle format*, not about needing a server. Adding a
 * copyrighted modern translation (NIV, ESV, NLT, NKJV) instead requires
 * a commercial license from its publisher; the ASV (1901) is another
 * public-domain option addable the same way these two were.
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import kjvRaw from "./bundled/kjv.json";

type ChapterMap = Record<string, Record<string, string>>;
interface BibleData {
  translation: string;
  name: string;
  license: string;
  books: string[];
  abbreviations: Record<string, string[]>;
  text: Record<string, ChapterMap>;
}

export type TranslationCode = "KJV" | "WEB";

const KJV: BibleData = kjvRaw as unknown as BibleData;

// Known ahead of time so the picker UI can show translation names before
// the (lazily-loaded) WEB data itself has ever been fetched.
const TRANSLATION_META: Record<TranslationCode, { name: string; license: string }> = {
  KJV: { name: KJV.name, license: KJV.license },
  WEB: { name: "World English Bible", license: "Public domain" },
};

export const AVAILABLE_TRANSLATIONS: { code: TranslationCode; name: string }[] = (
  Object.keys(TRANSLATION_META) as TranslationCode[]
).map((code) => ({ code, name: TRANSLATION_META[code].name }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const webAssetModule = require("./bundled/web.bibledata");
let webBibleCache: BibleData | null = null;

async function loadWebBible(): Promise<BibleData> {
  if (webBibleCache) return webBibleCache;
  const asset = Asset.fromModule(webAssetModule);
  let text: string;
  if (Platform.OS === "web") {
    text = await fetch(asset.uri).then((r) => r.text());
  } else {
    await asset.downloadAsync();
    text = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
  }
  webBibleCache = JSON.parse(text) as BibleData;
  return webBibleCache;
}

const STORAGE_KEY = "amani.translation.v1";
let activeCode: TranslationCode = "KJV";
let bible: BibleData = KJV;
const listeners = new Set<() => void>();

export function getActiveTranslationCode(): TranslationCode {
  return activeCode;
}

async function resolveTranslationData(code: TranslationCode): Promise<BibleData> {
  return code === "KJV" ? KJV : loadWebBible();
}

export async function setActiveTranslation(code: TranslationCode): Promise<void> {
  if (code === activeCode) return;
  const data = await resolveTranslationData(code);
  activeCode = code;
  bible = data;
  listeners.forEach((fn) => fn());
  await AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
}

/** Loads the last-chosen translation, if different from the default.
 * Call once, early, at app start — see app/_layout.tsx. */
export async function loadSavedTranslation(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && saved in TRANSLATION_META && saved !== activeCode) {
      const code = saved as TranslationCode;
      const data = await resolveTranslationData(code);
      activeCode = code;
      bible = data;
      listeners.forEach((fn) => fn());
    }
  } catch {
    // fall back to the default silently
  }
}

/** Re-renders the calling component whenever the active translation
 * changes, so displayed scripture text stays in sync with the picker. */
export function useActiveTranslation(): TranslationCode {
  const [code, setCode] = useState(activeCode);
  useEffect(() => {
    function update() {
      setCode(activeCode);
    }
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);
  return code;
}

export const TRANSLATION = {
  get code() {
    return bible.translation;
  },
  get name() {
    return bible.name;
  },
  get license() {
    return bible.license;
  },
};

// Book names/order are identical across bundled translations (the WEB
// dataset was built directly from this same list) — fixed to KJV's copy
// so it's available before WEB has ever been loaded.
export const BOOKS = KJV.books;

export interface VerseResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

export function formatReference(book: string, chapter: number, verse?: number): string {
  return verse !== undefined ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`;
}

export function getVerse(book: string, chapter: number, verse: number): string | undefined {
  return bible.text[book]?.[String(chapter)]?.[String(verse)];
}

export function getChapter(book: string, chapter: number): { verse: number; text: string }[] {
  const chapterData = bible.text[book]?.[String(chapter)];
  if (!chapterData) return [];
  return Object.keys(chapterData)
    .map(Number)
    .sort((a, b) => a - b)
    .map((v) => ({ verse: v, text: chapterData[String(v)] }));
}

export function chapterCount(book: string): number {
  return Object.keys(bible.text[book] ?? {}).length;
}

/** Loose parse of a reference string into a book name fragment + chapter/verse. */
function splitInput(raw: string): { bookPart: string; chapter?: number; verse?: number } | null {
  const s = raw.trim();
  if (!s) return null;

  const chapterVerse = s.match(/(\d{1,3})\s*[:.]\s*(\d{1,3})\s*$/);
  const chapterOnly = !chapterVerse ? s.match(/(\d{1,3})\s*$/) : null;

  let bookPart = s;
  let chapter: number | undefined;
  let verse: number | undefined;

  if (chapterVerse && chapterVerse.index !== undefined) {
    chapter = parseInt(chapterVerse[1], 10);
    verse = parseInt(chapterVerse[2], 10);
    bookPart = s.slice(0, chapterVerse.index);
  } else if (chapterOnly && chapterOnly.index !== undefined) {
    // Careful: don't eat a leading book-number like "2" in "2 cor" when
    // there's nothing else after it (that's a book prefix, not a chapter).
    const candidateBookPart = s.slice(0, chapterOnly.index).trim();
    if (candidateBookPart.length > 0) {
      chapter = parseInt(chapterOnly[1], 10);
      bookPart = candidateBookPart;
    }
  }

  bookPart = bookPart.replace(/\.$/, "").trim();
  return { bookPart, chapter, verse };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "").replace(/\./g, "");
}

export function resolveBook(bookPart: string): string | null {
  const q = normalize(bookPart);
  if (!q) return null;

  for (const book of BOOKS) {
    const bookNorm = normalize(book);
    if (bookNorm === q) return book;
  }
  for (const [book, abbrevs] of Object.entries(bible.abbreviations)) {
    if (abbrevs.some((a) => normalize(a) === q)) return book;
  }
  for (const book of BOOKS) {
    const bookNorm = normalize(book);
    if (q.length >= 2 && bookNorm.startsWith(q)) return book;
  }
  for (const [book, abbrevs] of Object.entries(bible.abbreviations)) {
    if (q.length >= 2 && abbrevs.some((a) => normalize(a).startsWith(q))) return book;
  }
  return null;
}

/**
 * Turn free-typed shorthand ("2 cor 5:7", "jn 3:16", "romans 8") into
 * concrete verse suggestions, for the note editor's live verse-insert bar
 * and the Bible tab's reference search.
 */
export function getVerseCandidates(input: string, limit = 5): VerseResult[] {
  const parsed = splitInput(input);
  if (!parsed || !parsed.chapter) return [];

  const book = resolveBook(parsed.bookPart);
  if (!book) return [];

  if (parsed.verse !== undefined) {
    const text = getVerse(book, parsed.chapter, parsed.verse);
    if (!text) return [];
    return [
      {
        book,
        chapter: parsed.chapter,
        verse: parsed.verse,
        text,
        reference: formatReference(book, parsed.chapter, parsed.verse),
      },
    ];
  }

  // Chapter given without a verse — offer the opening verses of that chapter.
  const chapter = getChapter(book, parsed.chapter);
  return chapter.slice(0, limit).map((v) => ({
    book,
    chapter: parsed.chapter!,
    verse: v.verse,
    text: v.text,
    reference: formatReference(book, parsed.chapter!, v.verse),
  }));
}

/** Plain keyword search across the whole bundled translation. */
export function searchKeyword(query: string, limit = 30): VerseResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const results: VerseResult[] = [];

  outer: for (const book of BOOKS) {
    const chapters = bible.text[book];
    if (!chapters) continue;
    for (const chapterKey of Object.keys(chapters)) {
      const verses = chapters[chapterKey];
      for (const verseKey of Object.keys(verses)) {
        const text = verses[verseKey];
        if (text.toLowerCase().includes(q)) {
          results.push({
            book,
            chapter: Number(chapterKey),
            verse: Number(verseKey),
            text,
            reference: formatReference(book, Number(chapterKey), Number(verseKey)),
          });
          if (results.length >= limit) break outer;
        }
      }
    }
  }
  return results;
}

/**
 * A small, hand-picked set of cross references for well-known verses —
 * illustrative "related verses" data, not a generated dataset. Swap for
 * a full cross-reference dataset (e.g. the public-domain Treasury of
 * Scripture Knowledge) before shipping this feature for real.
 */
export const SAMPLE_CROSS_REFERENCES: Record<string, string[]> = {
  "John 3:16": ["1 John 4:9", "Romans 5:8", "John 1:14"],
  "2 Corinthians 5:7": ["Hebrews 11:1", "Romans 8:24", "2 Corinthians 4:18"],
  "Romans 8:28": ["Genesis 50:20", "Jeremiah 29:11", "Philippians 1:6"],
  "Philippians 4:13": ["2 Corinthians 12:9", "Isaiah 41:10", "Ephesians 3:16"],
  "Jeremiah 29:11": ["Romans 8:28", "Proverbs 3:5-6", "Isaiah 55:8-9"],
  "Psalms 23:1": ["John 10:11", "Psalms 100:3", "Isaiah 40:11"],
  "Isaiah 40:31": ["Psalms 27:14", "Galatians 6:9", "2 Corinthians 4:16"],
  "Proverbs 3:5": ["Psalms 37:5", "Isaiah 26:3-4", "Jeremiah 17:7"],
  "Matthew 6:33": ["Psalms 37:4", "Luke 12:31", "Philippians 4:19"],
  "Romans 12:2": ["Ephesians 4:23", "2 Corinthians 5:17", "Colossians 3:2"],
  "1 Corinthians 13:4": ["Colossians 3:14", "1 Peter 4:8", "John 13:34-35"],
  "Joshua 1:9": ["Deuteronomy 31:6", "Isaiah 41:10", "Psalms 27:1"],
  "Galatians 5:22": ["Ephesians 5:9", "Colossians 3:12-14", "2 Peter 1:5-7"],
  "Ephesians 2:8": ["Romans 3:23-24", "Titus 3:5", "2 Timothy 1:9"],
  "Hebrews 11:1": ["2 Corinthians 5:7", "Romans 8:24-25", "1 Peter 1:8"],
  "Psalms 46:1": ["Isaiah 41:10", "Deuteronomy 31:6", "Nahum 1:7"],
};
