// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Off by default on this Expo SDK version. Needed for packages that only
// publish a package.json "exports" map with no legacy "main" fallback —
// e.g. @vercel/analytics/react — which otherwise fail to resolve with
// "Unable to resolve module" even though the file is right there.
config.resolver.unstable_enablePackageExports = true;

// The second bundled Bible translation (src/data/bundled/web.bibledata,
// plain JSON despite the odd extension) is loaded as a binary asset at
// runtime via expo-asset instead of being `import`ed as a JS module.
// Two ~4MB translations both inlined as JS object literals crashes the
// Hermes bytecode compiler on Android release builds (verified: works
// fine with one inlined translation, crashes with two) — treating the
// second one as an asset keeps it out of the JS bundle entirely. A
// custom extension is used, rather than reassigning `.json` itself, so
// this doesn't change how any *other* JSON file in the project resolves.
config.resolver.assetExts.push("bibledata");

module.exports = config;
