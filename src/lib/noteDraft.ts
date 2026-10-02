import { SermonNote } from "@/types/note";

/**
 * A note with nothing worth keeping: no title, no church/preacher, no tags,
 * and no block holding real content. A heading — or an all-empty checklist —
 * counts as structure rather than content, so a freshly templated note (all
 * headings, nothing typed yet) can still be discarded when the editor is
 * closed. This is what stops "New sermon note → back" from leaving a ghost
 * "Untitled note" behind.
 *
 * Kept here rather than inside the editor screen so it can be unit-tested
 * on its own.
 */
export function isBlankNote(note: SermonNote): boolean {
  return (
    !note.title.trim() &&
    !note.church?.trim() &&
    !note.preacher?.trim() &&
    !(note.tags && note.tags.length > 0) &&
    note.blocks.every(
      (b) =>
        b.type === "heading" ||
        (b.type === "text" && !b.text.trim()) ||
        (b.type === "checklist" && b.items.every((i) => !i.text.trim()))
    )
  );
}