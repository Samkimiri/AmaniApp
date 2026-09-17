import AsyncStorage from "@react-native-async-storage/async-storage";
import { bookmarks, highlights } from "./verseMarks";

describe("verseMarks store (bookmarks/highlights)", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("starts with nothing marked", async () => {
    expect(await bookmarks.isMarked("John 3:16")).toBe(false);
    expect(await bookmarks.getAll()).toEqual([]);
  });

  it("toggle adds a mark and returns true, then removes it and returns false", async () => {
    const verse = { reference: "John 3:16", text: "For God so loved the world" };
    const added = await bookmarks.toggle(verse);
    expect(added).toBe(true);
    expect(await bookmarks.isMarked("John 3:16")).toBe(true);

    const removed = await bookmarks.toggle(verse);
    expect(removed).toBe(false);
    expect(await bookmarks.isMarked("John 3:16")).toBe(false);
  });

  it("defaults a new highlight to gold, and setColor changes an existing one", async () => {
    const verse = { reference: "Romans 8:28", text: "all things work together" };
    await highlights.toggle(verse);
    const mark = await highlights.get("Romans 8:28");
    expect(mark?.color).toBe("gold");

    await highlights.setColor("Romans 8:28", "sky");
    const updated = await highlights.get("Romans 8:28");
    expect(updated?.color).toBe("sky");
  });

  it("setColor on a verse that was never marked is a no-op, not an error", async () => {
    await expect(highlights.setColor("Nowhere 1:1", "sky")).resolves.toBeUndefined();
    expect(await highlights.get("Nowhere 1:1")).toBeUndefined();
  });

  it("toggle can be given an explicit color instead of the gold default", async () => {
    const verse = { reference: "Psalm 23:1", text: "The Lord is my shepherd" };
    await highlights.toggle(verse, "lavender");
    expect((await highlights.get("Psalm 23:1"))?.color).toBe("lavender");
  });

  it("keeps bookmarks and highlights in separate stores for the same verse", async () => {
    const verse = { reference: "Psalm 23:1", text: "The Lord is my shepherd" };
    await bookmarks.toggle(verse);
    expect(await bookmarks.isMarked("Psalm 23:1")).toBe(true);
    expect(await highlights.isMarked("Psalm 23:1")).toBe(false);
  });

  it("getAll returns the most recently marked verse first", async () => {
    await bookmarks.toggle({ reference: "Genesis 1:1", text: "In the beginning" });
    // A real (not fake-timer) delay, so the two marks can't land in the
    // same millisecond and make the sort-by-savedAt order ambiguous.
    await new Promise((resolve) => setTimeout(resolve, 5));
    await bookmarks.toggle({ reference: "Revelation 22:21", text: "The grace of the Lord" });
    const all = await bookmarks.getAll();
    expect(all[0].reference).toBe("Revelation 22:21");
    expect(all[1].reference).toBe("Genesis 1:1");
  });

  it("remove deletes a mark outright", async () => {
    const verse = { reference: "John 3:16", text: "For God so loved the world" };
    await bookmarks.toggle(verse);
    await bookmarks.remove("John 3:16");
    expect(await bookmarks.isMarked("John 3:16")).toBe(false);
  });
});
