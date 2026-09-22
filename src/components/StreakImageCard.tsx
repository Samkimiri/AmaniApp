import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { OpenBookIcon } from "./icons";

export const STREAK_CARD_WIDTH = 360;
export const STREAK_CARD_HEIGHT = 480;

export interface StreakImageCardProps {
  streak: number;
  planName: string;
  daysDone: number;
  daysTotal: number;
}

/** The shareable "day streak" card — same branded look and capture
 * pattern as VerseImageCard, just built for a plan's progress instead of
 * a verse. Rendered offscreen and captured with react-native-view-shot. */
export const StreakImageCard = forwardRef<ViewShot, StreakImageCardProps>(function StreakImageCard(
  { streak, planName, daysDone, daysTotal },
  ref
) {
  const pct = daysTotal ? Math.min(1, daysDone / daysTotal) : 0;
  return (
    <ViewShot ref={ref} options={{ format: "png", quality: 0.95 }}>
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <OpenBookIcon size={16} color={colors.goldLight} />
          <Text style={styles.brand}>AMANI</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.fire}>&#128293;</Text>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
          <View style={styles.rule} />
          <Text style={styles.planName}>{planName}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
          <Text style={styles.planMeta}>
            {daysDone} of {daysTotal} days
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Shared from Amani</Text>
        </View>
      </View>
    </ViewShot>
  );
});

const styles = StyleSheet.create({
  card: {
    width: STREAK_CARD_WIDTH,
    height: STREAK_CARD_HEIGHT,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 36,
    paddingHorizontal: 34,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { fontFamily: fontFamily.sansExtraBold, fontSize: 13, letterSpacing: 2, color: colors.goldLight },
  body: { alignItems: "center", gap: 6 },
  fire: { fontSize: 40 },
  streakNumber: { fontFamily: fontFamily.serifBold, fontSize: 56, color: colors.white, lineHeight: 60 },
  streakLabel: {
    fontFamily: fontFamily.sansExtraBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.goldLight,
  },
  rule: { width: 34, height: 2, backgroundColor: colors.goldLight, marginTop: 14, marginBottom: 14 },
  planName: { fontFamily: fontFamily.serifSemibold, fontSize: 18, color: colors.white, textAlign: "center" },
  barTrack: { width: 220, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)", marginTop: 14, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.goldLight },
  planMeta: { fontFamily: fontFamily.sansSemibold, fontSize: 12.5, color: "#C9D6E8", marginTop: 8 },
  footer: { alignItems: "center" },
  footerTitle: { fontFamily: fontFamily.sansBold, fontSize: 13, color: "#EDE7D8" },
});
