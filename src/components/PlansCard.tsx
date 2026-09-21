import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import {
  allCompletionDates,
  currentStreak,
  formatDayReading,
  getReadingPlans,
  nextDayIndex,
  useReadingProgress,
} from "@/data/readingPlans";
import { CalendarIcon, ChevronRightIcon } from "./icons";

/** Entry point to reading plans. Shows today's reading from the plan being
 * followed (the one started most recently that isn't finished) plus the
 * reading streak, or an invitation to start one. */
export function PlansCard() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const progress = useReadingProgress();
  const plans = getReadingPlans();
  const streak = currentStreak(allCompletionDates(progress));

  const active = plans
    .filter((p) => progress[p.id] && nextDayIndex(p, progress[p.id]) < p.days.length)
    .sort((a, b) => progress[b.id].startedAt.localeCompare(progress[a.id].startedAt))[0];
  const day = active ? nextDayIndex(active, progress[active.id]) : 0;

  return (
    <Pressable
      onPress={() => router.push(active ? `/plans?plan=${active.id}` : "/plans")}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={active ? `Reading plan: ${active.name}, day ${day + 1}` : "Reading plans"}
    >
      <View style={styles.icon}>
        <CalendarIcon size={20} color={colors.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>
          {active ? `${active.name} · Day ${day + 1}` : "Reading plans"}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {active ? formatDayReading(active.days[day]) : "Read the Bible a little each day"}
        </Text>
      </View>
      {streak > 0 ? (
        <View style={styles.streak}>
          <Text style={styles.streakText}>
            {streak} day{streak === 1 ? "" : "s"}
          </Text>
        </View>
      ) : null}
      <ChevronRightIcon size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginTop: 12,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 10.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.gold,
    },
    title: { fontFamily: fontFamily.serifBold, fontSize: 16.5, color: colors.textPrimary, marginTop: 2 },
    streak: {
      paddingHorizontal: 9,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.verseBg,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
    },
    streakText: { fontFamily: fontFamily.sansBold, fontSize: 11, color: colors.textPrimary },
  });
}
