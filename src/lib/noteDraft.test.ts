import { isBlankNote } from "./noteDraft";
import { newId, SermonNote } from "@/types/note";

function makeNote(overrides: Partial<SermonNote> = {}): SermonNote {
  return {
    id: newId(),
    title: "",
    date: "Sun, Jan 1",
    blocks: [{ id: newId(), type: "text", text: "" }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("isBlankNote", () => {
  it("treats a brand-new note as blank", () => {
    expect(isBlankNote(makeNote())).toBe(true);
  });

  it("is blank when the only content is whitespace", () => {
    expect(isBlankNote(makeNote({ blocks: [{ id: newId(), type: "text", text: "   \n  " }] }))).toBe(true);
  });

  it("is blank with only headings and empty checklist rows — structure, not content", () => {
    expect(
      isBlankNote(
        makeNote({
          blocks: [
            { id: newId(), type: "heading", text: "Point 1" },
            { id: newId(), type: "checklist", items: [{ id: newId(), text: "  ", done: false }] },
          ],
        })
      )
    ).toBe(true);
  });

  it("is not blank once a title is typed", () => {
    expect(isBlankNote(makeNote({ title: "Sunday" }))).toBe(false);
  });

  it("is not blank with a church, preacher or tag", () => {
    expect(isBlankNote(makeNote({ church: "Grace Chapel" }))).toBe(false);
    expect(isBlankNote(makeNote({ preacher: "Pastor Jane" }))).toBe(false);
    expect(isBlankNote(makeNote({ tags: ["faith"] }))).toBe(false);
  });

  it("is not blank with real body text, a verse, a photo or audio", () => {
    expect(isBlankNote(makeNote({ blocks: [{ id: newId(), type: "text", text: "a" }] }))).toBe(false);
    expect(
      isBlankNote(makeNote({ blocks: [{ id: newId(), type: "verse", reference: "John 3:16", text: "For God so loved" }] }))
    ).toBe(false);
    expect(isBlankNote(makeNote({ blocks: [{ id: newId(), type: "image", uri: "file://a.jpg" }] }))).toBe(false);
    expect(
      isBlankNote(
        makeNote({ blocks: [{ id: newId(), type: "audio", uri: "file://a.m4a", durationMillis: 1000 }] })
      )
    ).toBe(false);
  });

  it("is not blank once a checklist row has text", () => {
    expect(
      isBlankNote(
        makeNote({
          blocks: [{ id: newId(), type: "checklist", items: [{ id: newId(), text: "Pray daily", done: false }] }],
        })
      )
    ).toBe(false);
  });
});