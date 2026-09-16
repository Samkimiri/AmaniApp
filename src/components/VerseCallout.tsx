import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fontFamily } from "@/theme/typography";
import { getHighlightColor } from "@/theme/highlightColors";

/** A styled scripture quote block, used inline in notes and in the Bible
 * reader. `color` picks its background from the shared highlight palette
 * (see src/theme/highlightColors.ts) — defaults to gold, matching the
 * app's original look, if not given. */
export function VerseCallout({
  reference,
  text,
  compact = false,
  color,
}: {
  reference: string;
  text: string;
  compact?: boolean;
  color?: string;
}) {
  const c = getHighlightColor(color);
  return (
    <View style={[styles.wrap, { backgroundColor: c.background, borderLeftColor: c.accent }, compact && styles.wrapCompact]}>
      <Text style={[styles.reference, { color: c.accent }]}>{reference}</Text>
      <Text style={[styles.text, { color: c.text }, compact && styles.textCompact]}>&ldquo;{text}&rdquo;</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    gap: 4,
  },
  wrapCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reference: {
    fontFamily: fontFamily.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  text: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 15.5,
    lineHeight: 23,
    marginTop: 4,
  },
  textCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
});
