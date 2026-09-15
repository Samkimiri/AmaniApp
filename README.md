# Amani — sermon notes + offline Bible

A mobile-and-web app for taking sermon notes and reading Scripture, built
with Expo (React Native) + TypeScript. No account, no server — every
note, photo, and recording stays on the device it was created on.

Deployed at [amani-app.vercel.app](https://amani-app.vercel.app) (web/PWA — installable via the browser's "Add to Home Screen" or install prompt). iOS/Android builds haven't been produced yet — see "Native builds" below.

## What's implemented

- **Home** — a "New sermon note" shortcut, an install prompt (web), a
  daily verse from the offline Bible, and a preview of your most recent
  note.
- **Note editor** — title, preacher, tags, and free-form text, with
  inline blocks you insert as you write:
  - **Verses** — type a shorthand reference (`2 cor 5:7`, `jn 3:16`,
    `romans 8`) into the insert bar and tap a live suggestion.
  - **Photos** — take one with the camera or choose one from your
    library.
  - **Audio** — record sermon audio directly into the note, with
    playback. Recordings are moved into durable storage (IndexedDB on
    web, the app's document directory on native) so they survive
    closing and reopening the app — the location expo-av first writes
    to is *not* guaranteed to persist otherwise.
  - Notes autosave locally as you type (`AsyncStorage`); blank notes
    aren't kept.
  - Hold a note in the list, or use the delete option in its share
    sheet, to remove it.
- **Bible tab** — search by keyword or reference and read the full text
  offline, in either of two bundled translations (switch via the badge
  in the header, or in Profile). Bookmark or highlight any verse, and
  jump back to your bookmarks from the chip row. A hand-picked
  cross-reference list demonstrates "related verses" for well-known
  passages.
- **Search & organization** — search across your own notes (title,
  preacher, tags, and body text) from the Notes tab, and filter by tag.
- **App lock** — an optional on-device PIN (Profile → App lock), with a
  configurable auto-lock delay. No account behind it — it's a local
  passcode, not authentication against a server.
- **Backup** — export every note (with photos and recordings embedded)
  as one JSON file, and restore from it later, on this device or a new
  one. This is the only way to recover anything if the device is lost
  or its storage is cleared, since there's no server copy.
- **Share sheet** — from the note editor: a verse-card image, a full
  note as PDF (native) or a formatted print-to-PDF tab (web), plain
  text, and delete. "Amani link" (opening a note in someone else's copy
  of the app) is an honest stub — see "What's intentionally unfinished"
  below.
- **PWA** — installable, works fully offline after one successful load
  (service worker precaches the app shell and current JS bundle), with
  a manifest, social preview card, and Vercel Analytics (web only, no
  note content).
- **Privacy & terms** — `/legal`, describing exactly what's stored
  where (nothing leaves the device).

## Getting started

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go (iOS/Android), press `i` / `a` for a
simulator, or `w` for a browser. Requires Node 18+.

```bash
npm run typecheck   # TypeScript, no emit
```

## Project layout

```
app/                  Screens (Expo Router — file-based routing)
  (tabs)/             Home, Notes, Bible, Profile
  note/[id].tsx        Note editor (id="new" for a fresh note)
  legal.tsx            Privacy policy + terms
src/
  theme/              Colors + typography tokens
  components/         Shared UI: buttons, cards, icons, share sheet, app lock, backup
  context/            AlertContext (cross-platform alert/action-sheet), AppLockContext
  data/               Bible engine, notes/backup/audio storage, bookmarks
    bundled/           Bible text — kjv.json (inlined), web.bibledata (lazy asset, see below)
  hooks/               useNotes, useAppLock, useInstallPrompt
  types/               Note/block types + text/HTML rendering helpers
public/                PWA files served as-is at the web root (manifest, service worker, index.html template, robots.txt)
metro.config.js        Package-exports resolution + the second translation's asset extension (see comments in the file)
eas.json               EAS Build profile scaffold — not yet used to produce a real build (see "Native builds")
```

## Native builds

`eas.json` and `app.json`'s `ios.buildNumber`/`android.versionCode` are
in place, but no `.ipa`/`.aab` has actually been built or submitted.
That requires:

```bash
npx eas login          # your own Expo account
npx eas build --platform android --profile preview   # or ios
```

— which in turn needs an Apple Developer account (iOS) and/or a Google
Play Console account (Android) for real submission, plus the store
listing assets (screenshots, description) and privacy questionnaires
those consoles ask for. None of that is set up here.

## Licensing & copyright — what's safe to ship as-is, and what isn't

- **Fonts — Newsreader & Plus Jakarta Sans.** Google Fonts, SIL Open
  Font License: free to use, bundle, and modify commercially, no
  royalties, no attribution requirement.
- **Bible text.** Both bundled translations are public domain:
  - **KJV** (King James Version, 1611) — `src/data/bundled/kjv.json`,
    assembled from a public-domain KJV text repackaged as JSON.
  - **WEB** (World English Bible) — `src/data/bundled/web.bibledata`,
    converted from the public dataset at
    [github.com/TehShrike/world-english-bible](https://github.com/TehShrike/world-english-bible);
    the WEB is explicitly released copyright-free by its translators.
    A handful of verse numbers in this dataset are well-documented
    manuscript variants (e.g. Acts 8:37, Romans 16:25–27) that modern
    translations typically footnote rather than include — the bundled
    file notes this directly in those verse slots rather than leaving
    them blank.

  `web.bibledata` is plain JSON despite its unusual extension — see the
  comment in `metro.config.js` for why (two ~4MB translations both
  inlined as JS crashes the Hermes bytecode compiler on Android; this
  one loads lazily as a binary asset instead, the first time someone
  switches to it).
- **Icons.** Every icon in `src/components/icons.tsx` is hand-drawn SVG
  path data written for this project — nothing to license or credit.
- **App icon / splash.** Original artwork in the app's navy/gold
  palette, not derived from any existing logo or brand asset.
- **Sample content.** Any names shown in placeholder/demo notes are
  fictional, not a real church or person.

**What would need attention before a public launch:**

- **The app name "Amani."** Carried over as a working name from the
  original concept doc — not a cleared trademark. Run a trademark
  search in your target markets before committing to it publicly; it
  also gates picking a custom domain.
- **Adding a modern copyrighted translation** (NIV, ESV, NLT, NKJV,
  etc.) requires a commercial license/API agreement from its publisher
  (Biblica, Crossway, Tyndale, Thomas Nelson). The ASV (1901) is another
  public-domain option addable the same way KJV/WEB were.
- **Cross-reference data** (`SAMPLE_CROSS_REFERENCES` in
  `src/data/bible.ts`) is a curated sample of well-known pairings, not a
  full dataset — swap in something like the public-domain Treasury of
  Scripture Knowledge before shipping this feature as comprehensive.
- **The `/legal` page's contact line** is a placeholder — fill in a real
  contact method before publishing it.

## What's intentionally unfinished

These show an honest "not built yet" message rather than pretending to
work:

- **Tags exist, but there's no filter/organize-by-preacher view beyond
  the Notes tab's own tag chips** — a fuller browse-by-church/preacher
  view is a natural next step.
- **"Amani link"** (share sheet) — opening a note directly inside
  someone else's copy of the app needs real accounts and a sync
  backend, which is out of scope here.
- **Dark mode** — not implemented. `app.json` sets
  `userInterfaceStyle: light`; adding a real theme switch means
  converting every screen's styles from module-level `StyleSheet.create`
  calls to theme-reactive ones, which hasn't been done.
