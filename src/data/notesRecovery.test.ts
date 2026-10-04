import { mergeNotes, needsRepair, normalizeNote, notesInPayload, salvageNotes } from "./notesRecovery";
import { newId, SermonNote } from "@/types/note";

function makeNote(overrides: Partial<SermonNote> = {}): SermonNote {
  return {
    id: newId(),
    title: "Note",
    date: "Sun, Jan 1",
    blocks: [{ id: newId(), type: "text", text: "Hello" }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("notesRecovery.normalizeNote", () => {
  it("fills in every missing field so a partial legacy note stays usable", () => {
    const note = normalizeNote({ title: "Only a title" });
    expect(note.title).toBe("Only a title");
    expect(note.id).toBeTruthy();
    expect(note.blocks).toEqual([]);
    expect(typeof note.createdAt).toBe("string");
    expect(note.updatedAt).toBe(note.createdAt);
  });

  it("keeps the text of a block whose type it doesn't recognise", () => {
    const note = normalizeNote({
      id: "n",
      blocks: [{ id: "b", type: "paragraph", content: "Don't lose me" }],
    });
    expect(note.blocks).toEqual([{ id: "b", type: "text", text: "Don't lose me" }]);
  });

  it("gives ids to blocks and checklist rows that are missing them", () => {
    const note = normalizeNote({
      id: "n",
      blocks: [{ type: "checklist", items: [{ text: "Pray", done: true }] }],
    });
    const [block] = note.blocks;
    expect(block.id).toBeTruthy();
    expect(block.type).toBe("checklist");
    if (block.type === "checklist") {
      expect(block.items[0]).toMatchObject({ text: "Pray", done: true });
      expect(block.items[0].id).toBeTruthy();
    }
  });
});

describe("notesRecovery.salvageNotes", () => {
  it("returns every note from a well-formed array", () => {
    const notes = [makeNote({ title: "One" }), makeNote({ title: "Two" })];
    expect(salvageNotes(JSON.stringify(notes)).map((n) => n.title)).toEqual(["One", "Two"]);
  });

  it("reads notes out of an object that wraps the array", () => {
    const note = makeNote({ title: "Wrapped" });
    const raw = JSON.stringify({ app: "amani-backup", notes: [note] });
    expect(salvageNotes(raw).map((n) => n.title)).toEqual(["Wrapped"]);
  });

  it("recovers whole notes from a truncated document", () => {
    // What a write cut short can leave behind: the note object is complete,
    // the array around it never got its closing bracket.
    const kept = makeNote({ id: "kept", title: "Recovered" });
    expect(salvageNotes(`[${JSON.stringify(kept)},`).map((n) => n.title)).toEqual(["Recovered"]);
  });

  it("ignores payloads that don't contain any notes", () => {
    expect(salvageNotes(JSON.stringify({ hello: "world" }))).toEqual([]);
    expect(salvageNotes(JSON.stringify([{ id: "b", type: "text", text: "just a block" }]))).toEqual([]);
  });

  it("returns nothing for text with no notes in it", () => {
    expect(salvageNotes("{ not json")).toEqual([]);
    expect(salvageNotes(null)).toEqual([]);
    expect(salvageNotes("")).toEqual([]);
  });
});

describe("notesRecovery.mergeNotes", () => {
  it("keeps the most recently updated copy of a note, whichever list it's in", () => {
    const older = makeNote({ id: "a", title: "Older", updatedAt: "2026-01-01T00:00:00.000Z" });
    const newer = makeNote({ id: "a", title: "Newer", updatedAt: "2026-05-01T00:00:00.000Z" });
    expect(mergeNotes([older], [newer]).map((n) => n.title)).toEqual(["Newer"]);
    expect(mergeNotes([newer], [older]).map((n) => n.title)).toEqual(["Newer"]);
  });

  it("keeps notes only one of the lists has", () => {
    const a = makeNote({ id: "a" });
    const b = makeNote({ id: "b" });
    expect(mergeNotes([a], [b]).map((n) => n.id).sort()).toEqual(["a", "b"]);
  });
});

describe("notesRecovery.needsRepair", () => {
  it("is false for notes already in the current shape", () => {
    expect(needsRepair([makeNote()])).toBe(false);
  });

  it("is true when a note or a block is missing its id", () => {
    expect(needsRepair([{ title: "no id", blocks: [] }])).toBe(true);
    expect(needsRepair([{ id: "n", blocks: [{ type: "text", text: "no id" }] }])).toBe(true);
    expect(needsRepair([{ id: "n", title: "no blocks array" }])).toBe(true);
  });
});

describe("notesRecovery.notesInPayload", () => {
  it("accepts a well-formed array of notes, and an object wrapping one", () => {
    const note = makeNote({ title: "Real" });
    expect(notesInPayload([note]).map((n) => n.title)).toEqual(["Real"]);
    expect(notesInPayload({ notes: [note] }).map((n) => n.title)).toEqual(["Real"]);
  });

  it("rejects a list that isn't notes (bookmarks, reading-plan progress, stats)", () => {
    expect(notesInPayload([{ reference: "John 3:16", text: "…", savedAt: "2026-01-01" }])).toEqual([]);
    expect(notesInPayload({ "plan-1": { completed: {} } })).toEqual([]);
    expect(notesInPayload(["Genesis 1", "Romans 8"])).toEqual([]);
    expect(notesInPayload(null)).toEqual([]);
    expect(notesInPayload([])).toEqual([]);
  });
});
