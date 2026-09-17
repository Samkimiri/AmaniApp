// AsyncStorage's native module isn't available under Jest (there's no
// real device/simulator), so tests that import anything touching it
// (src/data/bible.ts, verseMarks.ts, appLock.ts, etc.) need this mock in
// place before those modules load.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
