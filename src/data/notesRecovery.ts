import { ChecklistItem, newId, NoteBlock, SermonNote } from "@/types/note";

/**
 * Recovery helpers for the notes store.
 *
 * A note is the one thing in Amani that can't be regenerated — the Bible is
 * bundled, but a sermon someone typed during a service exists only in the
 * bytes this device happens to be holding. So a payload we can't fully
 * understand must never be read as "no notes": it has to be read as
 * generously as possible, upgraded into the current shape, and merged with
 * anything else we can find, so nothing that was saved previously is lost.
 *
 * Everything here is pure (no storage access) so the recovery behavior can
 * be unit-tested on its own — see notesRecovery.test.ts.
 */

function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Does this plain object carry enough to be one of the user's notes?
 * Used to tell a whole note apart from the blocks and checklist rows nested
 * inside it while scanning a damaged payload. */
function looksLikeNote(value: unknown): boolean {
  if (!isObject(value)) return false;
  return (
    Array.isArray(value.blocks) ||
    typeof value.title === "string" ||
    (isNonEmptyString(value.id) && typeof value.date === "string")
  );
}

function normalizeChecklistItem(item: any): ChecklistItem | null {
  if (!isObject(item)) return null;
  return {
    id: isNonEmptyString(item.id) ? item.id : newId(),
    text: typeof item.text === "string" ? item.text : "",
    done: item.done === true,
  };
}

/**
 * Upgrades a single stored block into the shape the current app expects.
 * Required fields are filled in and a missing id is invented, so the block
 * stays editable. An unrecognised block type is kept as a paragraph if it
 * still carries text (so old or hand-edited content is never dropped); a
 * block with nothing readable in it is discarded.
 */
export function normalizeBlock(block: any): NoteBlock | null {
  if (!isObject(block)) return null;
  const id = isNonEmptyString(block.id) ? block.id : newId();

  switch (block.type) {
    case "text":
    case "heading":
      return { id, type: block.type, text: typeof block.text === "string" ? block.text : "" };
    case "verse":
      return {
        id,
        type: "verse",
        reference: typeof block.reference === "string" ? block.reference : "",
        text: typeof block.text === "string" ? block.text : "",
        ...(typeof block.color === "string" ? { color: block.color } : {}),
      };
    case "image":
      return {
        id,
        type: "image",
        uri: typeof block.uri === "string" ? block.uri : "",
        ...(typeof block.caption === "string" ? { caption: block.caption } : {}),
      };
    case "audio":
      return {
        id,
        type: "audio",
        uri: typeof block.uri === "string" ? block.uri : "",
        durationMillis:
          typeof block.durationMillis === "number" && isFinite(block.durationMillis)
            ? block.durationMillis
            : 0,
        ...(typeof block.transcript === "string" ? { transcript: block.transcript } : {}),
      };
    case "checklist":
      return {
        id,
        type: "checklist",
        items: (Array.isArray(block.items) ? block.items : [])
          .map(normalizeChecklistItem)
          .filter((i: ChecklistItem | null): i is ChecklistItem => i !== null),
      };
    default: {
      const text =
        typeof block.text === "string"
          ? block.text
          : typeof block.content === "string"
            ? block.content
            : "";
      return text ? { id, type: "text", text } : null;
    }
  }
}

/**
 * Fills in every field a note needs, so a note written by any previous
 * version of the app loads as a usable note instead of crashing the screen
 * (or being thrown away for looking unfamiliar).
 */
export function normalizeNote(note: any): SermonNote {
  const createdAt = typeof note?.createdAt === "string" ? note.createdAt : new Date().toISOString();
  const updatedAt = typeof note?.updatedAt === "string" ? note.updatedAt : createdAt;
  return {
    id: isNonEmptyString(note?.id) ? note.id : newId(),
    title: typeof note?.title === "string" ? note.title : "",
    church: typeof note?.church === "string" ? note.church : "",
    preacher: typeof note?.preacher === "string" ? note.preacher : "",
    tags: Array.isArray(note?.tags)
      ? note.tags.filter((t: unknown): t is string => typeof t === "string")
      : [],
    date: typeof note?.date === "string" ? note.date : "",
    blocks: (Array.isArray(note?.blocks) ? note.blocks : [])
      .map(normalizeBlock)
      .filter((b: NoteBlock | null): b is NoteBlock => b !== null),
    createdAt,
    updatedAt,
  };
}

/** True if reading this stored list had to repair anything — a missing id,
 * a missing/not-array `blocks`, or a malformed block. The store rewrites the
 * payload when this is set, so the upgrade is persisted once instead of
 * being re-done (with a fresh invented id every time) on each read. */
export function needsRepair(list: unknown[]): boolean {
  return list.some((note) => {
    if (!isObject(note)) return true;
    if (!isNonEmptyString(note.id)) return true;
    if (!Array.isArray(note.blocks)) return true;
    return note.blocks.some(
      (block: unknown) =>
        !isObject(block) || !isNonEmptyString((block as any).id) || !isNonEmptyString((block as any).type)
    );
  });
}

/** Pulls every balanced `{...}` out of a string, innermost first. Lets us
 * recover whole notes from JSON that no longer parses as one document —
 * e.g. an array a truncated write left without its closing bracket. */
function extractJsonObjects(raw: string): string[] {
  const objects: string[] = [];
  const starts: number[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") starts.push(i);
    else if (ch === "}") {
      const start = starts.pop();
      if (start !== undefined) objects.push(raw.slice(start, i + 1));
    }
  }
  return objects;
}

/**
 * Reads as many notes as it possibly can out of a raw stored payload,
 * however damaged: a well-formed array, an object wrapping one, or — when
 * the text no longer parses as a single document — every complete note
 * object still embedded in it.
 */
export function salvageNotes(raw: string | null | undefined): SermonNote[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : isObject(parsed) && Array.isArray(parsed.notes)
        ? parsed.notes
        : null;
    if (list) return list.filter(looksLikeNote).map(normalizeNote);
  } catch {
    // Fall through to the text scan below.
  }

  const found: SermonNote[] = [];
  for (const candidate of extractJsonObjects(raw)) {
    let value: unknown;
    try {
      value = JSON.parse(candidate);
    } catch {
      continue;
    }
    if (isObject(value) && Array.isArray(value.notes)) {
      for (const note of value.notes) if (looksLikeNote(note)) found.push(normalizeNote(note));
    } else if (looksLikeNote(value)) {
      found.push(normalizeNote(value));
    }
  }
  return mergeNotes(found);
}

/**
 * Combines note lists (live storage, a damaged payload, the last known-good
 * snapshot) into one, keyed by note id. When the same note turns up more
 * than once the most recently updated copy wins, so an older recovery copy
 * can never roll back edits the user has since made.
 */
export function mergeNotes(...lists: (SermonNote[] | null | undefined)[]): SermonNote[] {
  const byId = new Map<string, SermonNote>();
  for (const list of lists) {
    for (const note of list ?? []) {
      if (!note || !isNonEmptyString(note.id)) continue;
      const existing = byId.get(note.id);
      if (!existing || (note.updatedAt || "").localeCompare(existing.updatedAt || "") > 0) {
        byId.set(note.id, note);
      }
    }
  }
  return Array.from(byId.values());
}
