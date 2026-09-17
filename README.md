# Amani: Sermon Notes

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
  jump back to your bookmarks from the chip row. Cross-references cover
  ~29,000 verses (93% of the Bible), adapted from the Treasury of
  Scripture Knowledge.
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

### Setting up Google Drive backup

Settings → Google Drive backup lets someone sign in with their own Google
account and back up their notes to a private, hidden area of their own
Drive (the `drive.appdata` scope — Amani can never see or touch anything
else in their Drive). This is off by default and needs one-time setup
before it'll actually connect:

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com).
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → External → add the
   `.../auth/drive.appdata` scope.
4. **APIs & Services → Credentials → Create Credentials → OAuth client
   ID** → Application type **Web application**. Add your deployed URL
   (and `http://localhost:8081` for local testing) to both **Authorized
   JavaScript origins** and **Authorized redirect URIs**.
5. Copy the generated Client ID into `GOOGLE_CLIENT_ID` at the top of
   `src/components/GoogleDriveSection.tsx`.

Until that's a real client ID, the "Connect Google Drive" button tells
the user this feature isn't set up yet rather than failing confusingly.

While the OAuth consent screen is in "Testing" mode (Google's default),
only Google accounts explicitly added as test users can sign in — move
it to "Production" (which needs Google's review, since `drive.appdata`
is a sensitive scope) before relying on this for real users.

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
in place, and the native config has been validated with a local
`npx expo prebuild` dry run — Android generates its native project
cleanly (the folder itself is deleted afterward; this stays a managed-
workflow project, and EAS Build does its own prebuild in the cloud). iOS
prebuild can only run on macOS or Linux, so it hasn't been validated the
same way from this Windows environment — worth running once before a
real iOS build, just to catch config issues early:

```bash
npx expo prebuild --platform android --no-install   # then delete the generated android/ folder
npx expo prebuild --platform ios --no-install        # macOS/Linux only; delete ios/ after
```

No `.ipa`/`.aab` has actually been built or submitted yet. That requires:

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
- **Bible text.** All five bundled translations are public domain:
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
  - **ASV** (American Standard Version, 1901), **Darby** (The Darby
    Translation, 1889/1890), and **YLT** (Young's Literal Translation,
    1898) — `src/data/bundled/{asv,darby,ylt}.bibledata`, all public
    domain (pre-1929 publications; see e.g.
    [ebible.org's ASV copyright page](https://ebible.org/eng-asv/copyright.htm)).
    Converted from the structured JSON at
    [github.com/scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases)
    (`formats/json/{ASV,Darby,YLT}.json`) — that repo's own conversion
    code is MIT-licensed, layered over public-domain source texts, so no
    extra attribution is required for the text itself. As with WEB, a
    handful of well-documented manuscript-variant verses in the ASV (16
    verses, e.g. Acts 8:37) and Darby (3 verses) source data are blank
    (verse number present, text omitted); the bundled files note this
    directly in those verse slots instead of leaving them blank. Darby's
    source JSON also had one isolated, mechanical bug — every occurrence
    of the word "God" was missing its preceding space (e.g. "AndGod
    said"), an artifact of how the source markup was stripped — fixed at
    conversion time.

  `web.bibledata`, `asv.bibledata`, `darby.bibledata`, and `ylt.bibledata`
  are all plain JSON despite the unusual extension — see the comment in
  `metro.config.js` for why (two ~4MB translations both inlined as JS
  crashes the Hermes bytecode compiler on Android; every translation
  past KJV loads lazily as a binary asset instead, the first time
  someone switches to it).
- **Cross-references** — `src/data/bundled/cross-references.bibledata`
  (also a lazy asset, same reason as above), covering ~29,000 verses.
  Converted from the Treasury of Scripture Knowledge (public domain) via
  the structured dataset at
  [github.com/CrossReferences-org/bible-cross-references](https://github.com/CrossReferences-org/bible-cross-references),
  which is itself licensed **CC BY 4.0** — attribution to
  CrossReferences.org is included in Profile and `/legal`; keep that
  credit if you redistribute this data. That dataset anchors references
  to specific phrases within a verse and deliberately curates rather
  than including every TSK entry; the conversion here flattens that into
  one deduplicated list per verse (round-robin across phrase groups,
  capped at 6) to match this app's simple chip-row UI, and collapses
  verse ranges (e.g. "Prov 8:22-24") to their starting verse, since the
  reference parser in `src/data/bible.ts` doesn't resolve ranges.
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
