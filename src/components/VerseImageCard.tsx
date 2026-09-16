import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { OpenBookIcon } from "./icons";

export const VERSE_CARD_WIDTH = 360;
export const VERSE_CARD_HEIGHT = 580;

export interface VerseImageCardProps {
  verseText: string;
  reference?: string;
  footerTitle: string;
  footerMeta?: string;
}

/** The branded, shareable verse-card image — used both for a note's verse
 * card and for sharing the home screen's daily verse. Rendered offscreen
 * and captured with react-native-view-shot; forwards its ref so callers
 * can call `.capture()` on it directly. */
export const VerseImageCard = forwardRef<ViewShot, VerseImageCardProps>(function VerseImageCard(
  { verseText, reference, footerTitle, footerMeta },
  ref
) {
  return (
    <ViewShot ref={ref} options={{ format: "png", quality: 0.95 }}>
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <OpenBookIcon size={16} color={colors.goldLight} />
          <Text style={styles.brand}>AMANI</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.quoteMark}>&ldquo;</Text>
          <Text style={styles.verseText}>{verseText}</Text>
          <View style={styles.rule} />
          {reference ? <Text style={styles.reference}>{reference}</Text> : null}
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>{footerTitle}</Text>
          {footerMeta ? <Text style={styles.footerMeta}>{footerMeta}</Text> : null}
        </View>
      </View>
    </ViewShot>
  );
});

const styles = StyleSheet.create({
  card: {
    width: VERSE_CARD_WIDTH,
    height: VERSE_CARD_HEIGHT,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
    paddingHorizontal: 34,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { fontFamily: fontFamily.sansExtraBold, fontSize: 13, letterSpacing: 2, color: colors.goldLight },
  body: { alignItems: "center", gap: 16 },
  quoteMark: { fontFamily: fontFamily.serifSemibold, fontSize: 46, color: colors.goldLight, opacity: 0.55 },
  verseText: {
    fontFamily: fontFamily.serifSemibold,
    fontSize: 23,
    lineHeight: 33,
    color: colors.white,
    textAlign: "center",
  },
  rule: { width: 34, height: 2, backgroundColor: colors.goldLight },
  reference: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.goldLight,
  },
  footer: { alignItems: "center", gap: 4 },
  footerTitle: { fontFamily: fontFamily.sansBold, fontSize: 13, color: "#EDE7D8" },
  footerMeta: { fontFamily: fontFamily.sansRegular, fontSize: 11.5, color: "#93A4BC" },
});
