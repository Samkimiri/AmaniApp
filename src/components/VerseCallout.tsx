import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

/** A styled scripture quote block, used inline in notes and in the Bible reader. */
export function VerseCallout({
  reference,
  text,
  compact = false,
}: {
  reference: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.reference}>{reference}</Text>
      <Text style={[styles.text, compact && styles.textCompact]}>&ldquo;{text}&rdquo;</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.verseBg,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
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
    color: colors.verseText,
  },
  text: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 15.5,
    lineHeight: 23,
    color: "#4A3B12",
    marginTop: 4,
  },
  textCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
});
