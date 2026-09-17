import { formatDuration, newId, noteToHtml, noteToPlainText, SermonNote } from "./note";

function makeNote(overrides: Partial<SermonNote> = {}): SermonNote {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title: "Test note",
    church: "Grace Chapel",
    preacher: "Pastor Jane",
    date: "Sun, Jan 1",
    tags: ["faith"],
    blocks: [{ id: newId(), type: "text", text: "Hello world" }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("formatDuration", () => {
  it("formats zero and sub-minute durations", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(5000)).toBe("0:05");
  });

  it("formats minutes and pads seconds", () => {
    expect(formatDuration(65000)).toBe("1:05");
    expect(formatDuration(600000)).toBe("10:00");
  });

  it("clamps negative durations to zero rather than showing a negative time", () => {
    expect(formatDuration(-500)).toBe("0:00");
  });
});

describe("newId", () => {
  it("produces unique, non-empty ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id.length).toBeGreaterThan(0);
  });
});

describe("noteToPlainText", () => {
  it("includes the title, meta line, tags, and body text", () => {
    const text = noteToPlainText(makeNote());
    expect(text).toContain("Test note");
    expect(text).toContain("Grace Chapel");
    expect(text).toContain("Pastor Jane");
    expect(text).toContain("#faith");
    expect(text).toContain("Hello world");
    expect(text).toContain("Shared from Amani");
  });

  it("falls back to 'Untitled note' when there's no title", () => {
    const text = noteToPlainText(makeNote({ title: "" }));
    expect(text).toContain("Untitled note");
  });

  it("quotes verse blocks with their reference", () => {
    const note = makeNote({
      blocks: [{ id: newId(), type: "verse", reference: "John 3:16", text: "For God so loved the world" }],
    });
    expect(noteToPlainText(note)).toContain('"For God so loved the world" — John 3:16');
  });

  it("includes an audio block's transcript when present", () => {
    const note = makeNote({
      blocks: [
        { id: newId(), type: "audio", uri: "file://rec.m4a", durationMillis: 12000, transcript: "and God said" },
      ],
    });
    const text = noteToPlainText(note);
    expect(text).toContain("[Audio recording, 0:12]");
    expect(text).toContain("and God said");
  });

  it("renders a heading with a blank line before it, uppercased", () => {
    const note = makeNote({
      blocks: [{ id: newId(), type: "heading", text: "Introduction" }],
    });
    expect(noteToPlainText(note)).toContain("INTRODUCTION");
  });
});

describe("noteToHtml", () => {
  it("escapes HTML in the title and body so a crafted note can't inject markup", () => {
    const note = makeNote({
      title: '<img src=x onerror="alert(1)">',
      blocks: [{ id: newId(), type: "text", text: "<script>alert(2)</script>" }],
    });
    const html = noteToHtml(note);
    expect(html).not.toContain("<img src=x onerror");
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders **bold**, *italic*, and ==highlight== markers as real tags", () => {
    const note = makeNote({
      blocks: [{ id: newId(), type: "text", text: "a **bold** and *italic* and ==highlighted== word" }],
    });
    const html = noteToHtml(note);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<mark");
    expect(html).toContain(">highlighted</mark>");
  });

  it("renders consecutive '- ' lines as a single <ul> with one <li> each", () => {
    const note = makeNote({
      blocks: [{ id: newId(), type: "text", text: "- first\n- second\nplain line" }],
    });
    const html = noteToHtml(note);
    expect(html).toContain("<ul");
    expect((html.match(/<li>/g) ?? []).length).toBe(2);
    expect(html).toContain("<li>first</li>");
    expect(html).toContain("<li>second</li>");
  });

  it("escapes an image block's uri (a backup-import injection vector) rather than trusting it", () => {
    const note = makeNote({
      blocks: [{ id: newId(), type: "image", uri: '"><script>alert(3)</script>' }],
    });
    const html = noteToHtml(note);
    expect(html).not.toContain('"><script>alert(3)</script>');
  });

  it("colors a verse block's background using its stored highlight color", () => {
    const note = makeNote({
      blocks: [{ id: newId(), type: "verse", reference: "Romans 8:28", text: "all things work together", color: "sky" }],
    });
    const html = noteToHtml(note);
    // Sky's background from src/theme/highlightColors.ts
    expect(html).toContain("#E4EEFB");
  });
});
