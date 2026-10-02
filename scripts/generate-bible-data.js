/**
 * Regenerates two derived files from the bundled KJV text, and is kept in
 * the repo so both can be rebuilt if the source text is ever replaced:
 *
 *  1. src/data/bundled/kjv-books.json — just the book list, abbreviations
 *     and translation metadata. This stays *inlined* in the JS bundle
 *     (a few KB) so book names, reference parsing and chapter counts work
 *     synchronously, while the ~4MB of verse text itself loads lazily as a
 *     `.bibledata` asset (see src/data/bible.ts and metro.config.js).
 *
 *  2. __fixtures__/kjvMini.json — a small stand-in used only by the Jest
 *     suite. Running the real 4MB text through Babel on every test run was
 *     the single biggest cost in the suite (minutes, not seconds), and none
 *     of the unit tests depend on the full text: they need the real book
 *     list, the real chapter *structure* (so chapter counts and reading
 *     plans are exact), and the handful of verses they actually assert on.
 *
 * Usage:  node scripts/generate-bible-data.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const source = ["src/data/bundled/kjv.bibledata", "src/data/bundled/kjv.json"]
  .map((p) => path.join(root, p))
  .find((p) => fs.existsSync(p));

if (!source) {
  console.error("Could not find the bundled KJV text (kjv.bibledata / kjv.json).");
  process.exit(1);
}

const kjv = JSON.parse(fs.readFileSync(source, "utf8"));

// ---- 1. metadata only -----------------------------------------------------
const meta = {
  translation: kjv.translation,
  name: kjv.name,
  license: kjv.license,
  books: kjv.books,
  abbreviations: kjv.abbreviations,
};
fs.writeFileSync(
  path.join(root, "src/data/bundled/kjv-books.json"),
  JSON.stringify(meta, null, 2) + "\n"
);
console.log(`wrote src/data/bundled/kjv-books.json (${kjv.books.length} books)`);

// ---- 2. test fixture ------------------------------------------------------
// Every chapter is kept, with its real first verse, so chapter counts and
// the reading plans that depend on them stay exact; the verses the tests
// actually assert on are then restored verbatim.
const chapters = {};
for (const book of kjv.books) {
  const src = kjv.text[book] || {};
  const out = {};
  for (const chapter of Object.keys(src)) {
    out[chapter] = { "1": src[chapter]["1"] ?? "" };
  }
  chapters[book] = out;
}

function restore(book, chapter, verses) {
  if (!chapters[book] || !chapters[book][String(chapter)]) {
    throw new Error(`fixture: ${book} ${chapter} is missing from the source text`);
  }
  for (const verse of verses) {
    const text = kjv.text[book][String(chapter)][String(verse)];
    if (typeof text !== "string") throw new Error(`fixture: ${book} ${chapter}:${verse} not found`);
    chapters[book][String(chapter)][String(verse)] = text;
  }
}

restore("Genesis", 1, [1]);
restore("Psalms", 23, [1]);
restore("John", 3, [16]);
restore("Romans", 8, [1, 2, 3, 28]);
restore("1 Corinthians", 13, [4, 5, 6, 7]);

const fixture = { ...meta, text: chapters };
fs.mkdirSync(path.join(root, "__fixtures__"), { recursive: true });
fs.writeFileSync(path.join(root, "__fixtures__", "kjvMini.json"), JSON.stringify(fixture));
console.log("wrote __fixtures__/kjvMini.json");