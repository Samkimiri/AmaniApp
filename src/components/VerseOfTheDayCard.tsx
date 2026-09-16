import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { OpenBookIcon, ShareArrowIcon } from "./icons";
import { VerseResult } from "@/data/bible";

/** A daily-scripture card for the Home screen — the first thing a user
 * sees each time they open Amani, reinforcing the app's purpose. */
export function VerseOfTheDayCard({
  verse,
  onShare,
  sharing,
}: {
  verse: VerseResult;
  onShare?: () => void;
  sharing?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLabelRow}>
          <OpenBookIcon size={15} color={colors.goldLight} />
          <Text style={styles.label}>Verse of the day</Text>
        </View>
        {onShare ? (
          <Pressable
            onPress={onShare}
            disabled={sharing}
            hitSlop={8}
            style={[styles.shareButton, sharing && { opacity: 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel="Share the verse of the day"
          >
            <ShareArrowIcon size={13} color={colors.goldLight} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.text}>&ldquo;{verse.text}&rdquo;</Text>
      <Text style={styles.reference}>{verse.reference}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy,
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  shareButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: fontFamily.sansExtraBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.goldLight,
  },
  text: {
    fontFamily: fontFamily.serifSemibold,
    fontSize: 17,
    lineHeight: 26,
    color: colors.white,
  },
  reference: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: "#93A4BC",
  },
});
