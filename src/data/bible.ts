/**
 * Offline scripture engine.
 *
 * The bundled dataset (./bundled/kjv.json) is the full text of the King
 * James Version — first published 1611, in the public domain worldwide.
 * It ships inside the app bundle, so verse lookup, search, and reading
 * work with zero network connection from first launch, matching the
 * "offline-first" requirement from the product concept.
 *
 * To add a modern translation (NIV, ESV, NLT, NKJV, etc.), you must first
 * obtain a license/API agreement from its publisher (Biblica, Crossway,
 * Tyndale, Thomas Nelson) — those translations are copyrighted and CANNOT
 * be bundled or redistributed without permission. Public-domain
 * alternatives that are safe to add the same way KJV was — download the
 * text, shape it into { book: { chapter: { verse: text } } }, add it here
 * — include the ASV (1901) and the WEB (World English Bible, explicitly
 * released into the public domain).
 */
import raw from "./bundled/kjv.json";

type ChapterMap = Record<string, Record<string, string>>;
interface BibleData {
  translation: string;
  name: string;
  license: string;
  books: string[];
  abbreviations: Record<string, string[]>;
  text: Record<string, ChapterMap>;
}

const bible = raw as unknown as BibleData;

export const TRANSLATION = {
  code: bible.translation,
  name: bible.name,
  license: bible.license,
};

export const BOOKS = bible.books;

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
 * A small, hand-picked set of cross references for a handful of well-known
 * verses — illustrative "related verses" data, not a generated dataset.
 * Swap for a full cross-reference dataset (e.g. the public-domain Treasury
 * of Scripture Knowledge) before shipping.
 */
export const SAMPLE_CROSS_REFERENCES: Record<string, string[]> = {
  "John 3:16": ["1 John 4:9", "Romans 5:8", "John 1:14"],
  "2 Corinthians 5:7": ["Hebrews 11:1", "Romans 8:24", "2 Corinthians 4:18"],
  "Romans 8:28": ["Genesis 50:20", "Jeremiah 29:11", "Philippians 1:6"],
};
