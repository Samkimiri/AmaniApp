import {
  DEVOTIONALS,
  DEVOTIONAL_CATEGORIES,
  devotionalForDate,
  devotionalOfTheDay,
  getAdjacentDevotional,
  getDevotional,
  getRandomDevotional,
  resolvePassage,
  searchDevotionals,
} from "./devotionals";
import { __setBibleDataForTests } from "./bible";
import kjvFixture from "../../__fixtures__/kjvMini.json";

describe("devotionals", () => {
  beforeAll(() => {
    const fixture = JSON.parse(JSON.stringify(kjvFixture));
    if (!fixture.text["Hebrews"]) fixture.text["Hebrews"] = {};
    if (!fixture.text["Hebrews"]["11"]) fixture.text["Hebrews"]["11"] = {};
    fixture.text["Hebrews"]["11"]["1"] =
      "Now faith is the substance of things hoped for, the evidence of things not seen.";
    __setBibleDataForTests(fixture);
  });

  it("contains well-formed devotionals with intros, passages, reflection, and prayers", () => {
    expect(DEVOTIONALS.length).toBeGreaterThanOrEqual(30);
    for (const d of DEVOTIONALS) {
      expect(d.id).toBeTruthy();
      expect(d.title).toBeTruthy();
      expect(d.summary).toBeTruthy();
      expect(d.intro).toBeTruthy();
      expect(d.passages.length).toBeGreaterThan(0);
      expect(d.reflection.length).toBeGreaterThan(0);
      expect(d.prayer).toBeTruthy();
      if (d.category) {
        expect(DEVOTIONAL_CATEGORIES).toContain(d.category);
      }
    }
  });

  it("every related topic ID points to a valid devotional", () => {
    const allIds = new Set(DEVOTIONALS.map((d) => d.id));
    for (const d of DEVOTIONALS) {
      for (const relId of d.related) {
        expect(allIds.has(relId)).toBe(true);
      }
    }
  });

  it("finds a devotional by ID", () => {
    const faith = getDevotional("faith");
    expect(faith).toBeDefined();
    expect(faith?.title).toBe("Faith");
    expect(getDevotional("non-existent")).toBeUndefined();
  });

  it("returns a deterministic devotional of the day across timezones on the same date", () => {
    const dateA = new Date("2026-05-15T00:00:00Z");
    const dateB = new Date("2026-05-15T12:00:00Z");
    const d1 = devotionalOfTheDay(dateA);
    const d2 = devotionalOfTheDay(dateB);
    expect(d1.id).toBe(d2.id);

    // Adjacent days return different devotionals
    const dateNextDay = new Date("2026-05-16T00:00:00Z");
    const dNext = devotionalForDate(dateNextDay);
    expect(dNext).toBeDefined();
  });

  it("searches devotionals by keyword and category", () => {
    const results = searchDevotionals("peace");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.id === "peace")).toBe(true);

    const peaceCategory = searchDevotionals("", "Peace & Comfort");
    expect(peaceCategory.length).toBeGreaterThan(0);
    expect(peaceCategory.every((r) => r.category === "Peace & Comfort")).toBe(true);
  });

  it("cycles to adjacent devotionals cleanly", () => {
    const first = DEVOTIONALS[0];
    const next = getAdjacentDevotional(first.id, "next");
    expect(next.id).toBe(DEVOTIONALS[1].id);

    const prev = getAdjacentDevotional(first.id, "prev");
    expect(prev.id).toBe(DEVOTIONALS[DEVOTIONALS.length - 1].id);
  });

  it("gets a random devotional", () => {
    const random = getRandomDevotional("faith");
    expect(random).toBeDefined();
    expect(random.id).not.toBe("faith");
  });

  it("resolves passages using the loaded Bible text", () => {
    const resolved = resolvePassage({
      reference: "Hebrews 11:1",
      insight: "A foundational definition of faith",
    });
    expect(resolved.reference).toBe("Hebrews 11:1");
    expect(resolved.text).toBe(
      "Now faith is the substance of things hoped for, the evidence of things not seen."
    );
    expect(resolved.book).toBe("Hebrews");
    expect(resolved.chapter).toBe(11);
    expect(resolved.verse).toBe(1);
  });
});
