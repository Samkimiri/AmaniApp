import React, { useEffect, useState } from "react";
import { Image, ImageStyle, Platform, StyleProp, View } from "react-native";
import { resolveImageUri } from "@/data/imageStorage";

/**
 * Renders a photo attached to a note. A note stores only a *reference* to
 * its photo (IndexedDB on web, a file path on native) rather than the bytes
 * themselves — see src/data/imageStorage.ts for why. Native file paths are
 * directly displayable; a web reference has to be read back out first, so
 * this resolves it and shows an empty placeholder for the frame or two that
 * takes. Anything that can't be resolved (a photo deleted from storage, a
 * hand-edited backup naming a missing file) falls back to a blank box
 * rather than a broken-image icon.
 */
export function NoteImage({ uri, style }: { uri: string; style?: StyleProp<ImageStyle> }) {
  const [resolved, setResolved] = useState<string | null>(Platform.OS === "web" ? null : uri);

  useEffect(() => {
    if (Platform.OS !== "web") {
      setResolved(uri);
      return;
    }
    let alive = true;
    resolveImageUri(uri)
      .then((value) => {
        if (alive) setResolved(value);
      })
      .catch(() => {
        if (alive) setResolved(null);
      });
    return () => {
      alive = false;
    };
  }, [uri]);

  if (!resolved) return <View style={style} />;
  return <Image source={{ uri: resolved }} style={style} />;
}