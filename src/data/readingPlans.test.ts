import {
  currentStreak,
  formatDayReading,
  getReadingPlans,
  localDateString,
  longestStreak,
  nextDayIndex,
  splitIntoDays,
} from "./readingPlans";

describe("splitIntoDays", () => {
  it("keeps order, loses nothing and never leaves a day empty", () => {
    const items = Array.from({ length: 89 }, (_, i) => i);
    const days = splitIntoDays(items, 30);
    expect(days).toHaveLength(30);
    expect(days.flat()).toEqual(items);
    for (const d of days) {
      expect(d.length === 2 || d.length === 3).toBe(true);
    }
  });
});

describe("formatDayReading", () => {
  it("collapses consecutive chapters into ranges", () => {
    expect(
      formatDayReading([
        { book: "Matthew", chapter: 1 },
        { book: "Matthew", chapter: 2 },
        { book: "Matthew", chapter: 3 },
        { book: "Mark", chapter: 1 },
      ])
    ).toBe("Matthew 1–3, Mark 1");
  });
});

describe("getReadingPlans", () => {
  it("covers every chapter of the Bible exactly once in the year plan", () => {
    const year = getReadingPlans().find((p) => p.id === "bible-365")!;
    expect(year.days).toHaveLength(365);
    expect(year.days.flat()).toHaveLength(1189);
    expect(year.days.every((d) => d.length > 0)).toBe(true);
  });
});

describe("currentStreak", () => {
  const today = new Date(2026, 5, 15);
  const day = (offset: number) => localDateString(new Date(2026, 5, 15 + offset));

  it("counts consecutive days ending today", () => {
    expect(currentStreak([day(0), day(-1), day(-2)], today)).toBe(3);
  });
  it("still counts when today is not done yet", () => {
    expect(currentStreak([day(-1), day(-2)], today)).toBe(2);
  });
  it("breaks after a missed day", () => {
    expect(currentStreak([day(-2), day(-3)], today)).toBe(0);
  });
  it("is zero with no history", () => {
    expect(currentStreak([], today)).toBe(0);
  });
});

describe("longestStreak", () => {
  const d = (offset: number) => localDateString(new Date(2026, 5, 15 + offset));

  it("finds the longest run even if it isn't the most recent one", () => {
    // a 2-day run long ago, then a gap, then today's single day
    expect(longestStreak([d(-20), d(-19), d(0)])).toBe(2);
  });
  it("ignores duplicate dates", () => {
    expect(longestStreak([d(0), d(0), d(-1)])).toBe(2);
  });
  it("is zero with no history", () => {
    expect(longestStreak([])).toBe(0);
  });
});

describe("nextDayIndex", () => {
  const plan = getReadingPlans()[0];
  it("starts at day 0", () => {
    expect(nextDayIndex(plan, undefined)).toBe(0);
  });
  it("skips completed days and reports finished", () => {
    expect(nextDayIndex(plan, { startedAt: "", completed: { "0": "x", "1": "x" } })).toBe(2);
    const all = Object.fromEntries(plan.days.map((_, i) => [String(i), "x"]));
    expect(nextDayIndex(plan, { startedAt: "", completed: all })).toBe(plan.days.length);
  });
});
