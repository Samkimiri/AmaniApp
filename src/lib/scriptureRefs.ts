import { getVerse, resolveBook } from "@/data/bible";
import { SermonNote } from "@/types/note";

export interface ScriptureRef {
  book: string;
  chapter: number;
  verse: number;
  /** last verse of a range like "John 3:16-18", if one was written */
  endVerse?: number;
  /** canonical display form, e.g. "John 3:16-18" */
  label: string;
}

// "John 3:16", "1 Cor 13:4-7", "Song of Solomon 2:1", "Rom. 8:28"
const REF_PATTERN =
  /((?:[1-3]|I{1,3})\s?[A-Za-z]{2,}\.?|[A-Za-z]{2,}(?:\s+of\s+[A-Za-z]+)?\.?)\s*(\d{1,3}):(\d{1,3})(?:\s?[-–]\s?(\d{1,3}))?/g;

/** The regex can swallow leading words ("the story of John 3:16" captures
 * "story of John"), so try the longest trailing run of words that is a
 * real book, down to the last word alone. */
function resolveTrailingBook(bookPart: string): string | null {
  const words = bookPart.replace(/\.$/, "").split(/\s+/);
  for (let n = Math.min(3, words.length); n >= 1; n--) {
    const book = resolveBook(words.slice(-n).join(" "));
    if (book) return book;
  }
  return null;
}

/** Finds Bible references typed into free text and keeps only the ones
 * that point at a verse that actually exists — so a time like "at 9:30"
 * or a score like "Game 2:1" is dropped rather than shown as scripture. */
export function extractReferences(text: string): ScriptureRef[] {
  const found = new Map<string, ScriptureRef>();
  for (const match of text.matchAll(REF_PATTERN)) {
    const [, bookPart, ch, vs, endVs] = match;
    const book = resolveTrailingBook(bookPart);
    if (!book) continue;
    const chapter = parseInt(ch, 10);
    const verse = parseInt(vs, 10);
    if (getVerse(book, chapter, verse) === undefined) continue;
    let endVerse = endVs ? parseInt(endVs, 10) : undefined;
    if (endVerse !== undefined && (endVerse <= verse || getVerse(book, chapter, endVerse) === undefined)) {
      endVerse = undefined;
    }
    const label = `${book} ${chapter}:${verse}${endVerse ? `–${endVerse}` : ""}`;
    if (!found.has(label)) found.set(label, { book, chapter, verse, endVerse, label });
  }
  return Array.from(found.values());
}

/** Every distinct reference across a note's typed text (body, subheadings,
 * title). Verse blocks are excluded — those are already shown as verses. */
export function extractNoteReferences(note: SermonNote): ScriptureRef[] {
  const text = [
    note.title,
    ...note.blocks.map((b) => (b.type === "text" || b.type === "heading" ? b.text : "")),
  ].join("\n");
  return extractReferences(text);
}
