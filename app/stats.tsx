import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { BookmarkIcon, CalendarIcon, ChartIcon, ChevronLeftIcon, HighlightIcon, NotesIcon, OpenBookIcon } from "@/components/icons";
import { notesStore } from "@/data/notesStore";
import { bookmarks, highlights } from "@/data/verseMarks";
import { getChaptersReadCount } from "@/data/readingStats";
import { allCompletionDates, completedCount, currentStreak, getReadingPlans, longestStreak, useReadingProgress } from "@/data/readingPlans";

interface Stats {
  chaptersRead: number;
  notes: number;
  bookmarked: number;
  highlighted: number;
  planDaysDone: number;
  plansCompleted: number;
}

/** A simple, honest look at what someone has actually done in Amani —
 * no leaderboards, no comparison to anyone else, just their own history.
 * Everything here is derived from data already stored locally; nothing
 * new is sent or tracked to produce it. */
export default function StatsScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const progress = useReadingProgress();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([notesStore.getAll(), bookmarks.getAll(), highlights.getAll(), getChaptersReadCount()]).then(
      ([notes, marks, hl, chaptersRead]) => {
        if (cancelled) return;
        const plans = getReadingPlans();
        const planDaysDone = plans.reduce((n, p) => n + completedCount(progress[p.id]), 0);
        const plansCompleted = plans.filter((p) => progress[p.id] && completedCount(progress[p.id]) >= p.days.length).length;
        setStats({
          chaptersRead,
          notes: notes.length,
          bookmarked: marks.length,
          highlighted: hl.length,
          planDaysDone,
          plansCompleted,
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [progress]);

  const dates = allCompletionDates(progress);
  const streak = currentStreak(dates);
  const best = longestStreak(dates);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeftIcon size={20} />
        </Pressable>
        <Text style={styles.headerTitle}>Your reading, so far</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.streakRow}>
          <View style={styles.streakCard}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
          <View style={styles.streakCard}>
            <Text style={styles.streakNumber}>{best}</Text>
            <Text style={styles.streakLabel}>best streak</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <StatTile
            styles={styles}
            icon={<OpenBookIcon size={18} color={colors.navy} />}
            value={stats?.chaptersRead ?? "…"}
            label="Chapters read"
          />
          <StatTile
            styles={styles}
            icon={<NotesIcon size={18} color={colors.navy} />}
            value={stats?.notes ?? "…"}
            label="Sermon notes"
          />
          <StatTile
            styles={styles}
            icon={<HighlightIcon size={18} color={colors.navy} />}
            value={stats?.highlighted ?? "…"}
            label="Verses highlighted"
          />
          <StatTile
            styles={styles}
            icon={<BookmarkIcon size={18} color={colors.navy} />}
            value={stats?.bookmarked ?? "…"}
            label="Verses bookmarked"
          />
          <StatTile
            styles={styles}
            icon={<CalendarIcon size={18} color={colors.navy} />}
            value={stats?.planDaysDone ?? "…"}
            label="Plan days completed"
          />
          <StatTile
            styles={styles}
            icon={<ChartIcon size={18} color={colors.navy} />}
            value={stats?.plansCompleted ?? "…"}
            label="Plans finished"
          />
        </View>

        <Text style={styles.footnote}>
          All of this lives only on this device — nothing here is uploaded or shared unless you choose to share it
          yourself.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  styles,
  icon,
  value,
  label,
}: {
  styles: ReturnType<typeof makeStyles>;
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingBottom: 8 },
    backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: fontFamily.serifBold, fontSize: 18, color: colors.textPrimary, flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    streakRow: { flexDirection: "row", gap: 12, marginTop: 6 },
    streakCard: {
      flex: 1,
      backgroundColor: colors.navy,
      borderRadius: 18,
      paddingVertical: 22,
      alignItems: "center",
    },
    streakNumber: { fontFamily: fontFamily.serifBold, fontSize: 34, color: colors.white },
    streakLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 10.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: "#C9D6E8",
      marginTop: 2,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 },
    tile: {
      width: "47%",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
    },
    tileIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    tileValue: { fontFamily: fontFamily.serifBold, fontSize: 24, color: colors.textPrimary },
    tileLabel: { fontFamily: fontFamily.sansSemibold, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    footnote: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 12,
      color: colors.textFaint,
      textAlign: "center",
      marginTop: 26,
      lineHeight: 18,
    },
  });
}
