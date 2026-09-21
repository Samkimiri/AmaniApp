import { extractNoteReferences, extractReferences } from "./scriptureRefs";
import { SermonNote } from "@/types/note";

describe("extractReferences", () => {
  it("finds a plain reference", () => {
    const refs = extractReferences("Today we read John 3:16 together.");
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ book: "John", chapter: 3, verse: 16, label: "John 3:16" });
  });

  it("handles ranges, numbered books and abbreviations", () => {
    const refs = extractReferences("See 1 Cor 13:4-7 and Rom. 8:28.");
    expect(refs.map((r) => r.label)).toEqual(["1 Corinthians 13:4–7", "Romans 8:28"]);
    expect(refs[0].endVerse).toBe(7);
  });

  it("finds a reference preceded by ordinary words", () => {
    const refs = extractReferences("the story of John 3:16 is famous");
    expect(refs.map((r) => r.label)).toEqual(["John 3:16"]);
  });

  it("drops things that only look like references", () => {
    expect(extractReferences("Meet at 9:30 on Sunday. Game 2:1 was close.")).toEqual([]);
  });

  it("drops verses that do not exist", () => {
    expect(extractReferences("John 3:99")).toEqual([]);
  });

  it("de-duplicates repeated references", () => {
    expect(extractReferences("John 3:16 ... again John 3:16")).toHaveLength(1);
  });
});

describe("extractNoteReferences", () => {
  it("scans title, text and headings but not verse blocks", () => {
    const note: SermonNote = {
      id: "n",
      title: "On Psalm 23:1",
      date: "2026-01-01",
      createdAt: "",
      updatedAt: "",
      blocks: [
        { id: "a", type: "text", text: "Also Romans 8:28" },
        { id: "b", type: "heading", text: "Genesis 1:1" },
        { id: "c", type: "verse", reference: "John 1:1", text: "In the beginning was the Word" },
      ],
    };
    expect(extractNoteReferences(note).map((r) => r.label)).toEqual([
      "Psalms 23:1",
      "Romans 8:28",
      "Genesis 1:1",
    ]);
  });
});
