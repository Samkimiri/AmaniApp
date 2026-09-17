import { formatReference, getVerse, getVerseCandidates, resolveBook, searchKeyword } from "./bible";

describe("formatReference", () => {
  it("formats a chapter-and-verse reference", () => {
    expect(formatReference("John", 3, 16)).toBe("John 3:16");
  });

  it("formats a chapter-only reference when no verse is given", () => {
    expect(formatReference("Romans", 8)).toBe("Romans 8");
  });
});

describe("resolveBook", () => {
  it("resolves an exact book name", () => {
    expect(resolveBook("John")).toBe("John");
  });

  it("resolves common abbreviations", () => {
    expect(resolveBook("jn")).toBe("John");
    expect(resolveBook("2 cor")).toBe("2 Corinthians");
    expect(resolveBook("rom")).toBe("Romans");
  });

  it("is case- and punctuation-insensitive", () => {
    expect(resolveBook("JOHN")).toBe("John");
    expect(resolveBook("j.n.")).toBe("John");
  });

  it("returns null for something that isn't a book", () => {
    expect(resolveBook("xyzzy")).toBeNull();
    expect(resolveBook("")).toBeNull();
  });
});

describe("getVerse", () => {
  it("returns real verse text for a known reference", () => {
    const text = getVerse("John", 3, 16);
    expect(text).toBeDefined();
    expect(text).toEqual(expect.stringContaining("God"));
    expect((text ?? "").length).toBeGreaterThan(20);
  });

  it("returns undefined for a chapter/verse that doesn't exist", () => {
    expect(getVerse("John", 999, 1)).toBeUndefined();
  });
});

describe("getVerseCandidates", () => {
  it("resolves a full 'book chapter:verse' reference to exactly one result", () => {
    const results = getVerseCandidates("jn 3:16");
    expect(results).toHaveLength(1);
    expect(results[0].reference).toBe("John 3:16");
    expect(results[0].text.length).toBeGreaterThan(0);
  });

  it("resolves a chapter-only reference to that chapter's opening verses", () => {
    const results = getVerseCandidates("romans 8", 3);
    expect(results.length).toBe(3);
    expect(results.every((r) => r.book === "Romans" && r.chapter === 8)).toBe(true);
    expect(results.map((r) => r.verse)).toEqual([1, 2, 3]);
  });

  it("returns nothing for unparseable input", () => {
    expect(getVerseCandidates("")).toHaveLength(0);
    expect(getVerseCandidates("not a reference at all")).toHaveLength(0);
  });
});

describe("searchKeyword", () => {
  it("finds verses containing a keyword", () => {
    const results = searchKeyword("beginning God created");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].reference).toBe("Genesis 1:1");
  });

  it("ignores queries shorter than 3 characters to avoid a whole-Bible scan on every keystroke", () => {
    expect(searchKeyword("in")).toHaveLength(0);
  });
});
