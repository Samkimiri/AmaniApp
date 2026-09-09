import { getVerseCandidates, VerseResult } from "./bible";

/**
 * Single-verse references only (the reference parser doesn't support
 * ranges like "3:5-6") — a hand-picked set of well-known, encouraging
 * verses spanning both Testaments for the Home screen's daily verse.
 */
const REFERENCES = [
  "Joshua 1:9",
  "Psalm 23:1",
  "Psalm 27:1",
  "Psalm 46:1",
  "Psalm 118:24",
  "Psalm 121:2",
  "Proverbs 3:5",
  "Isaiah 40:31",
  "Isaiah 41:10",
  "Jeremiah 29:11",
  "Lamentations 3:23",
  "Habakkuk 3:19",
  "Zephaniah 3:17",
  "Matthew 6:33",
  "Matthew 11:28",
  "Matthew 28:20",
  "John 3:16",
  "John 14:6",
  "John 14:27",
  "John 16:33",
  "Romans 8:28",
  "Romans 8:31",
  "Romans 12:2",
  "Romans 15:13",
  "2 Corinthians 5:7",
  "2 Corinthians 12:9",
  "Galatians 2:20",
  "Ephesians 2:8",
  "Philippians 4:6",
  "Philippians 4:13",
  "Philippians 4:19",
  "Colossians 3:23",
  "1 Thessalonians 5:18",
  "2 Timothy 1:7",
  "Hebrews 11:1",
  "Hebrews 13:8",
  "James 1:2",
  "1 Peter 5:7",
  "1 John 4:19",
  "Revelation 21:4",
];

/** Deterministic pick by day-of-year, so it's stable all day and rotates daily. */
export function getVerseOfTheDay(): VerseResult | null {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000);
  const reference = REFERENCES[dayOfYear % REFERENCES.length];
  return getVerseCandidates(reference, 1)[0] ?? null;
}
