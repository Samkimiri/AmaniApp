import { Platform } from "react-native";
import * as Sharing from "expo-sharing";

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Shares (native) or downloads (web) a captured verse-card image URI —
 * the same platform split used for every other image share in the app,
 * since expo-sharing's web fallback needs navigator.share, which is
 * unsupported on most desktop browsers. */
export async function shareVerseImageUri(uri: string, filename: string): Promise<void> {
  if (Platform.OS === "web") {
    downloadDataUrl(uri, filename);
  } else {
    await Sharing.shareAsync(uri, { mimeType: "image/png" });
  }
}
