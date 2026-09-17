// Live captions are a native-only feature (see the note editor's comment
// on why: on-device speech recognition means *live* dictation while the
// mic is open, which the web platform can't do reliably or consistently
// across browsers). `expo-speech-recognition`'s own web fallback wraps
// the browser's Web Speech API, but loading it at all crashed the whole
// web app in this Metro/react-native-web setup (a `class extends`
// referencing something undefined in this bundling environment) — a
// completely disproportionate cost for a feature this app doesn't even
// try to use on web. Metro/RN's `.web.ts` platform resolution means this
// file replaces the real package entirely for web builds, so that broken
// code path is never loaded in the first place.
export const ExpoSpeechRecognitionModule = {
  async requestPermissionsAsync() {
    return { granted: false };
  },
  start() {},
  stop() {},
};

export function useSpeechRecognitionEvent(_eventName: string, _handler: (event: any) => void): void {
  // no-op — the note editor never calls .start() on web, so this never fires.
}
