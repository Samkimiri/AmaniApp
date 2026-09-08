# Amani — sermon notes + offline Bible

A concept build of a mobile app for taking sermon notes and reading
Scripture, built with Expo (React Native) + TypeScript. This turns the
earlier product spec and UI mockups into real, runnable code — a
starting point to keep building in Claude Code, Cursor, or any editor.

## What's implemented

- **Home** — a "New sermon note" shortcut and a preview of your most
  recent note, read from on-device storage.
- **Note editor** — a title, free-form text, and two block types you can
  insert inline as you write:
  - **Verses** — type a shorthand reference (`2 cor 5:7`, `jn 3:16`,
    `romans 8`) into the insert bar and tap a live suggestion to drop the
    full verse text into the note.
  - **Photos** — attach a picture (e.g. a photographed sermon slide)
    from the device's photo library.
  - Notes autosave locally as you type (`AsyncStorage`), no account
    needed.
- **Bible tab** — search by keyword or reference and read the full text
  offline; a small hand-picked cross-reference list demonstrates
  "related verses" for a few well-known passages.
- **Share sheet** — four real, working formats from the note editor:
  1. **Verse card (image)** — renders a styled card off-screen and
     shares it as a PNG (`react-native-view-shot` + `expo-sharing`).
  2. **Full note (PDF)** — builds simple HTML from the note and exports
     it as a PDF (`expo-print` + `expo-sharing`).
  3. **Plain text** — copies the note to the clipboard
     (`expo-clipboard`).
  4. **Amani link** — an honest stub. Opening a note inside someone
     else's copy of the app needs a small sync backend (accounts, a
     server, a real deep-link resolver), which is out of scope for this
     concept build — tapping it explains that rather than pretending to
     work.

## Getting started

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for
a simulator. Requires Node 18+.

```bash
npm run typecheck   # TypeScript, no emit
```

## Project layout

```
app/                  Screens (Expo Router — file-based routing)
  (tabs)/             Home, Notes, Bible, Profile
  note/[id].tsx        Note editor (id="new" for a fresh note)
src/
  theme/              Colors + typography tokens
  components/         Shared UI: buttons, cards, icons, the share sheet
  data/               Bible engine + AsyncStorage notes CRUD
    bundled/kjv.json   The full offline Bible text (see Licensing)
  types/               Note/block types + text/HTML rendering helpers
```

## Licensing & copyright — what's safe to ship as-is, and what isn't

This build was put together specifically to avoid copyright problems.
Here's what's in it and why each piece is clear to use:

- **Fonts — Newsreader & Plus Jakarta Sans.** Both are Google Fonts
  released under the **SIL Open Font License**: free to use, bundle,
  and modify in a commercial app, no royalties, no attribution
  requirement. Chosen deliberately over Inter/Roboto/Arial so the app
  doesn't read as a generic template, while staying clean and legible
  for scripture and long-form notes.
- **Bible text — King James Version.** The bundled
  `src/data/bundled/kjv.json` (all 66 books, ~31,000 verses) is the
  **King James Version**, first published in 1611 and in the **public
  domain**. It was assembled from a public-domain KJV text repackaged
  as JSON. This is the only translation bundled, and it's safe to ship,
  modify, and redistribute freely.
- **Icons.** Every icon in `src/components/icons.tsx` is hand-drawn SVG
  path data written for this project — not pulled from an icon font or
  third-party icon library, so there's nothing to license or credit.
- **App icon / splash.** Generated from scratch (a simple original
  open-book mark in the app's navy/gold palette) — not a modified
  version of any existing logo or brand asset.
- **Sample content.** "Faith Bible Church" and "Pastor John Mwangi" are
  fictional placeholders for the demo note — not a real church or
  person.

**What would need attention before a real launch:**

- **Adding a modern translation (NIV, ESV, NLT, NKJV, etc.)** — these
  are copyrighted by their publishers (Biblica, Crossway, Tyndale,
  Thomas Nelson). You'd need a commercial license or API agreement
  before bundling or displaying their text. Other public-domain
  translations (ASV 1901, or the WEB — World English Bible, explicitly
  released copyright-free) can be added the same way the KJV data was
  built here, with no licensing step required.
- **The app name "Amani."** This is a working name carried over from
  the concept doc, not a cleared trademark. Run a trademark search in
  your target markets before committing to it publicly.
- **Cross-reference data** (`SAMPLE_CROSS_REFERENCES` in
  `src/data/bible.ts`) is a small illustrative sample, not a full
  dataset — swap in a complete public-domain set (e.g. the Treasury of
  Scripture Knowledge) before shipping this feature for real.
- **Audio recording and tagging** — the toolbar buttons for these are
  present but intentionally unwired (they show an explanatory alert)
  since they weren't part of this pass; see "Next steps" below.

## Next steps

- Wire up sermon audio recording (e.g. `expo-av`) with timestamped
  notes, as scoped in the original concept spec.
- Add tagging/organization by preacher, series, and date.
- Add the WEB or ASV translation as a second offline option.
- Build the small backend needed to make the "Amani link" share format
  real (accounts + a sync store), or drop that option until it exists.
- Replace the sample cross-reference list with a full dataset.
