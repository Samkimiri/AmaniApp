import { NoteBlock, SermonNote } from "@/types/note";

/**
 * "Amani link" — a note that travels inside the link itself.
 *
 * Amani has no accounts and no server, so there is nothing to host a note
 * on. Instead the note is encoded *into* the URL: whoever receives it opens
 * the link and Amani reads the note straight out of it. Nothing is uploaded,
 * nothing is stored anywhere in between, and a link keeps working with no
 * network at all — which is the only version of this feature that fits how
 * the rest of the app works.
 *
 * The cost of that choice is size: a URL can't carry photos or recordings,
 * so media blocks are left out (and the sender is told, rather than being
 * quietly short-changed). Text content — the part people actually pass
 * around — always travels in full.
 *
 * Everything here is pure, so it can be unit-tested on its own.
 */

/** Bumped only if the payload shape changes; old links then fail cleanly
 * with "this link is from a newer version" rather than decoding to junk. */
const LINK_VERSION = "1";
const TOKEN_PREFIX = `${LINK_VERSION}.`;
const PARAM = "n";

/** Practical length past which a link starts getting truncated by SMS and
 * some chat apps. Browsers and email handle far more, so this is a warning,
 * not a refusal. */
export const LINK_WARNING_LENGTH = 1900;

export interface NoteLink {
  /** What to actually send — a web URL on web, an app-scheme URL on native. */
  url: string;
  /** Just the encoded note, independent of how it will be delivered. */
  token: string;
  /** Media blocks the note had that the link couldn't carry. */
  droppedMedia: number;
  /** True once the link is long enough that some messaging apps may cut it. */
  long: boolean;
}

export interface ParsedNoteLink {
  note: SermonNote;
  /** Media the sender's note had, which didn't fit in the link. */
  droppedMedia: number;
}

/* ---------------------------------- base64url ---------------------------------- */

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** UTF-8 bytes for a string. Written out by hand because neither `Buffer`
 * nor `TextEncoder` is dependable across native, web and Jest, and a wrong
 * encoding here would silently corrupt non-English (e.g. Swahili or an
 * accented name) note text. */
function utf8Encode(input: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        const point = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        bytes.push(
          0xf0 | (point >> 18),
          0x80 | ((point >> 12) & 0x3f),
          0x80 | ((point >> 6) & 0x3f),
          0x80 | (point & 0x3f)
        );
        i++;
      } else {
        // Lone high surrogate — not valid text, so emit U+FFFD rather than
        // producing bytes that decode back into something different.
        bytes.push(0xef, 0xbf, 0xbd);
      }
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

function utf8Decode(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    if (b < 0x80) {
      out += String.fromCharCode(b);
      i += 1;
    } else if (b >= 0xc0 && b < 0xe0 && i + 1 < bytes.length) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if (b >= 0xe0 && b < 0xf0 && i + 2 < bytes.length) {
      out += String.fromCharCode(
        ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      );
      i += 3;
    } else if (b >= 0xf0 && i + 3 < bytes.length) {
      const point =
        ((b & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      const offset = point - 0x10000;
      out += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
      i += 4;
    } else {
      break; // truncated tail — stop rather than emit garbage
    }
  }
  return out;
}

function toBase64Url(input: string): string {
  const bytes = utf8Encode(input);
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 === undefined) break;
    out += B64_CHARS[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 === undefined) break;
    out += B64_CHARS[b2 & 0x3f];
  }
  return out; // unpadded: "-" and "_" instead of "+" and "/"
}

function fromBase64Url(token: string): string | null {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of token) {
    const value = B64_CHARS.indexOf(ch);
    if (value < 0) return null; // not a base64url character
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  /* ---------------------------------- payload ---------------------------------- */

function isMediaBlock(block: NoteBlock): boolean {
  return block.type === "image" || block.type === "audio";
}

/**
 * The note as it will travel: media blocks removed (a URL can't carry a
 * photo or a recording) and the rest kept exactly as-is, so verse colours,
 * checklists and subheadings all arrive intact. `_media` records how many
 * were left behind, so the receiver is told rather than left wondering.
 */
function toLinkNote(note: SermonNote): { payload: Record<string, unknown>; droppedMedia: number } {
  const all = (note.blocks ?? []).filter(Boolean);
  const blocks = all.filter((b) => !isMediaBlock(b));
  return {
    payload: {
      id: note.id,
      title: note.title ?? "",
      church: note.church ?? "",
      preacher: note.preacher ?? "",
      tags: Array.isArray(note.tags) ? note.tags : [],
      date: note.date ?? "",
      blocks,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      _media: all.length - blocks.length,
    },
    droppedMedia: all.length - blocks.length,
  };
}

/** Where a link should point for the platform the sender is on. Web gets a
 * normal URL anyone can open (the PWA *is* the app); native gets an app
 * link, which is what a phone that already has Amani understands. */
function linkBase(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/import`;
  }
  return "amani://import";
}

/** Builds the shareable link for a note. */
export function buildNoteLink(note: SermonNote): NoteLink {
  const { payload, droppedMedia } = toLinkNote(note);
  const token = `${TOKEN_PREFIX}${toBase64Url(JSON.stringify(payload))}`;
  const url = `${linkBase()}?${PARAM}=${token}`;
  return { url, token, droppedMedia, long: url.length > LINK_WARNING_LENGTH };
}

/** Pulls the encoded note out of anything the user might paste: a full link
 * (web or app scheme), a bare token, or one with the query string split off. */
export function extractNoteToken(input: string): string | null {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return null;

  const match = trimmed.match(new RegExp(`[?&#]${PARAM}=([^&#\\s]+)`));
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  if (trimmed.startsWith(TOKEN_PREFIX) && /^[\w.-]+$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Decodes a link back into a note. Returns null (never throws) for anything
 * unrecognisable, so a mistyped or truncated link lands on a clear "this
 * link isn't valid" message instead of taking the screen down.
 */
export function parseNoteLink(input: string): ParsedNoteLink | null {
  const token = extractNoteToken(input);
  if (!token) return null;

  if (!token.startsWith(TOKEN_PREFIX)) return null; // unknown/future version
  const json = fromBase64Url(token.slice(TOKEN_PREFIX.length));
  if (!json) return null;

  let raw: any;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.blocks)) return null;

  const note: SermonNote = {
    id: typeof raw.id === "string" && raw.id ? raw.id : "",
    title: typeof raw.title === "string" ? raw.title : "",
    church: typeof raw.church === "string" ? raw.church : "",
    preacher: typeof raw.preacher === "string" ? raw.preacher : "",
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t: unknown) => typeof t === "string") : [],
    date: typeof raw.date === "string" ? raw.date : "",
    blocks: raw.blocks.filter((b: any) => b && typeof b.type === "string"),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
  // The sender's note may have had media that couldn't travel; the receiver
  // is told so, rather than wondering where the slide photo went.
  const droppedMedia = typeof raw._media === "number" ? raw._media : 0;
  return { note, droppedMedia };
}