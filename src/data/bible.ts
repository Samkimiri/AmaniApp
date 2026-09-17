/**
 * Offline scripture engine, with five bundled public-domain translations.
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
 * - **ASV** (American Standard Version, 1901), **Darby** (The Darby
 *   Translation, 1889/1890), and **YLT** (Young's Literal Translation,
 *   1898) — all public domain (pre-1929 publications), converted from
 *   the structured JSON at github.com/scrollmapper/bible_databases
 *   (formats/json/{ASV,Darby,YLT}.json — MIT-licensed conversion
 *   scripts over public-domain source texts). Like WEB, the ASV and
 *   Darby source data leaves a handful of well-documented
 *   manuscript-variant verses blank (verse number present, text empty)
 *   rather than dropping the verse number entirely — those get the same
 *   explanatory-note treatment as WEB's Acts 8:37. Darby's source JSON
 *   also had one isolated, mechanical bug — a missing space before every
 *   occurrence of the word "God" (an artifact of how its source
 *   markup was stripped, e.g. "AndGod said") — fixed at conversion time.
 *
 * Every translation past the first (WEB, ASV, Darby, YLT) is loaded
 * lazily as a binary *asset* (via expo-asset) rather than a second
 * `import` — two ~4MB translations both inlined as JS object literals
 * crashes the Hermes bytecode compiler on Android release builds
 * (verified directly: one inlined translation builds fine, two does
 * not). Loading them as assets keeps them out of the JS bundle Hermes
 * has to compile; each is fetched once, the first time someone switches
 * to it, and cached in memory after that. See metro.config.js for the
 * matching resolver config.
 *
 * All of these still work with zero network connection once loaded —
 * this is about *bundle format*, not about needing a server. Adding a
 * copyrighted modern translation (NIV, ESV, NLT, NKJV) instead requires
 * a commercial license from its publisher.
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

export type TranslationCode = "KJV" | "WEB" | "ASV" | "DARBY" | "YLT";

const KJV: BibleData = kjvRaw as unknown as BibleData;

// Known ahead of time so the picker UI can show translation names before
// the (lazily-loaded) translation data itself has ever been fetched.
const TRANSLATION_META: Record<TranslationCode, { name: string; license: string }> = {
  KJV: { name: KJV.name, license: KJV.license },
  WEB: { name: "World English Bible", license: "Public domain" },
  ASV: { name: "American Standard Version", license: "Public domain" },
  DARBY: { name: "Darby Translation", license: "Public domain" },
  YLT: { name: "Young's Literal Translation", license: "Public domain" },
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const asvAssetModule = require("./bundled/asv.bibledata");
let asvBibleCache: BibleData | null = null;

async function loadAsvBible(): Promise<BibleData> {
  if (asvBibleCache) return asvBibleCache;
  const asset = Asset.fromModule(asvAssetModule);
  let text: string;
  if (Platform.OS === "web") {
    text = await fetch(asset.uri).then((r) => r.text());
  } else {
    await asset.downloadAsync();
    text = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
  }
  asvBibleCache = JSON.parse(text) as BibleData;
  return asvBibleCache;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const darbyAssetModule = require("./bundled/darby.bibledata");
let darbyBibleCache: BibleData | null = null;

async function loadDarbyBible(): Promise<BibleData> {
  if (darbyBibleCache) return darbyBibleCache;
  const asset = Asset.fromModule(darbyAssetModule);
  let text: string;
  if (Platform.OS === "web") {
    text = await fetch(asset.uri).then((r) => r.text());
  } else {
    await asset.downloadAsync();
    text = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
  }
  darbyBibleCache = JSON.parse(text) as BibleData;
  return darbyBibleCache;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const yltAssetModule = require("./bundled/ylt.bibledata");
let yltBibleCache: BibleData | null = null;

async function loadYltBible(): Promise<BibleData> {
  if (yltBibleCache) return yltBibleCache;
  const asset = Asset.fromModule(yltAssetModule);
  let text: string;
  if (Platform.OS === "web") {
    text = await fetch(asset.uri).then((r) => r.text());
  } else {
    await asset.downloadAsync();
    text = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
  }
  yltBibleCache = JSON.parse(text) as BibleData;
  return yltBibleCache;
}

const STORAGE_KEY = "amani.translation.v1";
let activeCode: TranslationCode = "KJV";
let bible: BibleData = KJV;
const listeners = new Set<() => void>();

export function getActiveTranslationCode(): TranslationCode {
  return activeCode;
}

async function resolveTranslationData(code: TranslationCode): Promise<BibleData> {
  switch (code) {
    case "KJV":
      return KJV;
    case "WEB":
      return loadWebBible();
    case "ASV":
      return loadAsvBible();
    case "DARBY":
      return loadDarbyBible();
    case "YLT":
      return loadYltBible();
  }
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
 * Cross-references for ~29,000 verses (93% of the Bible), derived from
 * the Treasury of Scripture Knowledge via the public dataset at
 * github.com/CrossReferences-org/bible-cross-references (CC BY 4.0 —
 * credited in Settings and /legal). That dataset anchors references to
 * specific phrases within a verse and deliberately curates rather than
 * dumping every TSK entry; this converts it into one flat, deduplicated
 * list per verse (round-robin across phrase groups, capped at 6) to
 * match this app's simple "related verses" chip row, and collapses
 * verse ranges (e.g. "Prov 8:22-24") to their starting verse, since the
 * reference parser above doesn't resolve ranges.
 *
 * Loaded lazily as a binary asset, same as the WEB translation and for
 * the same reason — it's multiple MB, and this app already crashed
 * Android's Hermes compiler once from inlining too much bundled data as
 * JS. `getCrossReferences` returns [] until the load finishes (normally
 * under a second); call `ensureCrossReferencesLoaded` once and re-render
 * on completion, as the Bible tab does.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const crossRefAssetModule = require("./bundled/cross-references.bibledata");
let crossRefCache: Record<string, string[]> | null = null;

export async function ensureCrossReferencesLoaded(): Promise<void> {
  if (crossRefCache) return;
  const asset = Asset.fromModule(crossRefAssetModule);
  let text: string;
  if (Platform.OS === "web") {
    text = await fetch(asset.uri).then((r) => r.text());
  } else {
    await asset.downloadAsync();
    text = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
  }
  crossRefCache = JSON.parse(text) as Record<string, string[]>;
}

export function getCrossReferences(reference: string): string[] {
  return crossRefCache?.[reference] ?? [];
}
