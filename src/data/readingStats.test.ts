import { getChaptersReadCount, markChapterRead } from "./readingStats";

describe("readingStats", () => {
  it("counts distinct chapters and ignores repeats", async () => {
    await markChapterRead("John", 3);
    await markChapterRead("John", 4);
    await markChapterRead("John", 3); // repeat
    expect(await getChaptersReadCount()).toBe(2);
  });
});
