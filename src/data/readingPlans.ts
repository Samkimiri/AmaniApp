import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BOOKS, chapterCount } from "./bible";

export interface ChapterRef {
  book: string;
  chapter: number;
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  days: ChapterRef[][];
}

const OT_COUNT = 39;

function chaptersOf(books: string[]): ChapterRef[] {
  const out: ChapterRef[] = [];
  for (const book of books) {
    for (let c = 1; c <= chapterCount(book); c++) out.push({ book, chapter: c });
  }
  return out;
}

/** Spreads chapters over `days` as evenly as possible, keeping them in
 * order — e.g. 89 chapters over 30 days gives days of 2 or 3 chapters,
 * never an empty day and never a lopsided last day. */
export function splitIntoDays<T>(items: T[], days: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < days; i++) {
    const start = Math.floor((i * items.length) / days);
    const end = Math.floor(((i + 1) * items.length) / days);
    result.push(items.slice(start, end));
  }
  return result;
}

/** "Matthew 1–3, Mark 1" — consecutive chapters in a book collapse to a range. */
export function formatDayReading(chapters: ChapterRef[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < chapters.length) {
    const { book } = chapters[i];
    let j = i;
    while (j + 1 < chapters.length && chapters[j + 1].book === book && chapters[j + 1].chapter === chapters[j].chapter + 1) {
      j++;
    }
    parts.push(j === i ? `${book} ${chapters[i].chapter}` : `${book} ${chapters[i].chapter}–${chapters[j].chapter}`);
    i = j + 1;
  }
  return parts.join(", ");
}

let plansCache: ReadingPlan[] | null = null;

export function getReadingPlans(): ReadingPlan[] {
  if (plansCache) return plansCache;
  plansCache = [
    {
      id: "proverbs-31",
      name: "Proverbs in a month",
      description: "One chapter of wisdom a day, 31 days",
      days: splitIntoDays(chaptersOf(["Proverbs"]), 31),
    },
    {
      id: "gospels-30",
      name: "The Gospels in 30 days",
      description: "Matthew, Mark, Luke and John",
      days: splitIntoDays(chaptersOf(["Matthew", "Mark", "Luke", "John"]), 30),
    },
    {
      id: "psalms-proverbs-60",
      name: "Psalms & Proverbs",
      description: "Prayer and wisdom over 60 days",
      days: splitIntoDays(chaptersOf(["Psalms", "Proverbs"]), 60),
    },
    {
      id: "new-testament-90",
      name: "New Testament in 90 days",
      description: "Matthew through Revelation, about 3 chapters a day",
      days: splitIntoDays(chaptersOf(BOOKS.slice(OT_COUNT)), 90),
    },
    {
      id: "bible-365",
      name: "The Bible in a year",
      description: "Genesis through Revelation in 365 days",
      days: splitIntoDays(chaptersOf(BOOKS), 365),
    },
  ];
  return plansCache;
}

// ---- progress -------------------------------------------------------------

export interface PlanProgress {
  startedAt: string;
  /** day index (0-based) -> local date (YYYY-MM-DD) it was completed on */
  completed: Record<string, string>;
}
export type AllProgress = Record<string, PlanProgress>;

export function localDateString(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Consecutive calendar days, ending today (or yesterday, so a streak
 * isn't shown as broken before you've had the chance to read today),
 * on which at least one plan day was completed. */
export function currentStreak(dates: string[], today: Date = new Date()): number {
  const set = new Set(dates);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!set.has(localDateString(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(localDateString(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function nextDayIndex(plan: ReadingPlan, progress: PlanProgress | undefined): number {
  const done = progress?.completed ?? {};
  for (let i = 0; i < plan.days.length; i++) if (!(String(i) in done)) return i;
  return plan.days.length; // finished
}

export function completedCount(progress: PlanProgress | undefined): number {
  return progress ? Object.keys(progress.completed).length : 0;
}

const STORAGE_KEY = "amani.readingPlans.v1";
let progressState: AllProgress = {};
let progressLoaded = false;
const listeners = new Set<(p: AllProgress) => void>();

async function loadProgress(): Promise<void> {
  if (progressLoaded) return;
  progressLoaded = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") progressState = { ...parsed, ...progressState };
    }
  } catch {
    // unreadable progress just means starting fresh
  }
  listeners.forEach((fn) => fn(progressState));
}

function commit(next: AllProgress) {
  progressState = next;
  listeners.forEach((fn) => fn(progressState));
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progressState)).catch(() => {});
}

export function startPlan(planId: string): void {
  if (progressState[planId]) return;
  commit({ ...progressState, [planId]: { startedAt: new Date().toISOString(), completed: {} } });
}

export function setDayCompleted(planId: string, dayIndex: number, done: boolean): void {
  const existing = progressState[planId] ?? { startedAt: new Date().toISOString(), completed: {} };
  const completed = { ...existing.completed };
  if (done) completed[String(dayIndex)] = localDateString(new Date());
  else delete completed[String(dayIndex)];
  commit({ ...progressState, [planId]: { ...existing, completed } });
}

export function resetPlan(planId: string): void {
  const next = { ...progressState };
  delete next[planId];
  commit(next);
}

export function useReadingProgress(): AllProgress {
  const [progress, setProgress] = useState<AllProgress>(progressState);
  const refresh = useCallback(() => setProgress(progressState), []);
  useEffect(() => {
    listeners.add(setProgress);
    loadProgress().then(refresh);
    return () => {
      listeners.delete(setProgress);
    };
  }, [refresh]);
  return progress;
}

export function allCompletionDates(progress: AllProgress): string[] {
  return Object.values(progress).flatMap((p) => Object.values(p.completed));
}
