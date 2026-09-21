import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import { fontFamily } from "@/theme/typography";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import {
  allCompletionDates,
  completedCount,
  currentStreak,
  formatDayReading,
  getReadingPlans,
  nextDayIndex,
  ReadingPlan,
  resetPlan,
  setDayCompleted,
  startPlan,
  useReadingProgress,
} from "@/data/readingPlans";

function openChapter(book: string, chapter: number) {
  router.push(`/bible-read?book=${encodeURIComponent(book)}&chapter=${chapter}`);
}

/** Reading plans: pick a plan, see today's reading, tick days off. All
 * progress lives on this device — no account, no server. */
export default function PlansScreen() {
  const params = useLocalSearchParams<{ plan?: string }>();
  const plans = getReadingPlans();
  const [selectedId, setSelectedId] = useState<string | null>(
    params.plan && plans.some((p) => p.id === params.plan) ? params.plan : null
  );
  const colors = useColors();
  const styles = makeStyles(colors);
  const progress = useReadingProgress();
  const showAlert = useAlert();
  const streak = currentStreak(allCompletionDates(progress));
  const selected = plans.find((p) => p.id === selectedId) ?? null;

  function goBack() {
    if (selected && !params.plan) setSelectedId(null);
    else router.back();
  }

  function confirmReset(plan: ReadingPlan) {
    showAlert({
      title: "Restart this plan?",
      message: "Your checkmarks for this plan will be cleared. This can't be undone.",
      actions: [
        { label: "Cancel", style: "cancel" },
        { label: "Restart", style: "destructive", onPress: () => resetPlan(plan.id) },
      ],
    });
  }

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={goBack}
        style={styles.backButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <ChevronLeftIcon size={20} />
      </Pressable>
      <Text style={styles.headerTitle}>{selected ? selected.name : "Reading plans"}</Text>
    </View>
  );

  if (!selected) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        {header}
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.intro}>
                Pick a plan and read a little each day. Tick off each day as you go — it&apos;s all saved on this
                device.
              </Text>
              {streak > 0 ? (
                <View style={styles.streakBanner}>
                  <CalendarIcon size={18} color={colors.gold} />
                  <Text style={styles.streakBannerText}>
                    {streak}-day reading streak
                  </Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const p = progress[item.id];
            const done = completedCount(p);
            const pct = item.days.length ? done / item.days.length : 0;
            return (
              <Pressable
                onPress={() => setSelectedId(item.id)}
                style={({ pressed }) => [styles.planCard, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}. ${item.description}. ${p ? `${done} of ${item.days.length} days done` : "Not started"}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{item.name}</Text>
                  <Text style={styles.planDesc}>{item.description}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
                  </View>
                  <Text style={styles.planMeta}>
                    {p ? `${done} of ${item.days.length} days` : `${item.days.length} days · not started`}
                  </Text>
                </View>
                <ChevronRightIcon size={18} color={colors.textMuted} />
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    );
  }

  const p = progress[selected.id];
  const done = completedCount(p);
  const total = selected.days.length;
  const next = nextDayIndex(selected, p);
  const finished = p && next >= total;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {header}
      <FlatList
        data={selected.days}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.content}
        initialNumToRender={20}
        ListHeaderComponent={
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.intro}>{selected.description}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round((total ? done / total : 0) * 100)}%` }]} />
            </View>
            <Text style={styles.planMeta}>
              {done} of {total} days{streak > 0 ? ` · ${streak}-day streak` : ""}
            </Text>

            {!p ? (
              <Pressable
                onPress={() => startPlan(selected.id)}
                style={styles.primary}
                accessibilityRole="button"
                accessibilityLabel="Start this plan"
              >
                <Text style={styles.primaryText}>Start this plan</Text>
              </Pressable>
            ) : finished ? (
              <View style={styles.todayCard}>
                <Text style={styles.todayLabel}>Plan complete</Text>
                <Text style={styles.todayTitle}>Well done — you finished every day.</Text>
              </View>
            ) : (
              <View style={styles.todayCard}>
                <Text style={styles.todayLabel}>Day {next + 1} · up next</Text>
                <View style={styles.chipRow}>
                  {selected.days[next].map((c) => (
                    <Pressable
                      key={`${c.book}-${c.chapter}`}
                      onPress={() => openChapter(c.book, c.chapter)}
                      style={styles.chip}
                      accessibilityRole="button"
                      accessibilityLabel={`Read ${c.book} ${c.chapter}`}
                    >
                      <Text style={styles.chipText}>
                        {c.book} {c.chapter}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={() => setDayCompleted(selected.id, next, true)}
                  style={styles.primary}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark day ${next + 1} complete`}
                >
                  <Text style={styles.primaryText}>Mark day {next + 1} complete</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.sectionLabel}>All days</Text>
          </View>
        }
        ListFooterComponent={
          p ? (
            <Pressable onPress={() => confirmReset(selected)} style={styles.reset} accessibilityRole="button">
              <Text style={styles.resetText}>Restart this plan</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item, index }) => {
          const completed = !!p && String(index) in p.completed;
          return (
            <View style={styles.dayRow}>
              <Pressable
                onPress={() => {
                  if (!p) startPlan(selected.id);
                  setDayCompleted(selected.id, index, !completed);
                }}
                hitSlop={8}
                style={[styles.check, completed && styles.checkDone]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: completed }}
                accessibilityLabel={`Day ${index + 1}, ${formatDayReading(item)}`}
              >
                {completed ? <Text style={styles.checkMark}>&#10003;</Text> : null}
              </Pressable>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => openChapter(item[0].book, item[0].chapter)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${formatDayReading(item)}`}
              >
                <Text style={[styles.dayNumber, completed && styles.dayDone]}>Day {index + 1}</Text>
                <Text style={[styles.dayReading, completed && styles.dayDone]}>{formatDayReading(item)}</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingBottom: 8 },
    backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: fontFamily.serifBold, fontSize: 19, color: colors.textPrimary, flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    intro: { fontFamily: fontFamily.sansRegular, fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: 14 },
    streakBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      backgroundColor: colors.verseBg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      height: 32,
      marginBottom: 6,
    },
    streakBannerText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.textPrimary },
    planCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginTop: 12,
    },
    planName: { fontFamily: fontFamily.serifBold, fontSize: 17, color: colors.textPrimary },
    planDesc: { fontFamily: fontFamily.sansRegular, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
    planMeta: { fontFamily: fontFamily.sansSemibold, fontSize: 12, color: colors.textSecondary, marginTop: 6 },
    barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.borderLight, marginTop: 12, overflow: "hidden" },
    barFill: { height: 6, borderRadius: 3, backgroundColor: colors.gold },
    todayCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginTop: 16,
    },
    todayLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 10.5,
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: colors.gold,
    },
    todayTitle: { fontFamily: fontFamily.serifBold, fontSize: 17, color: colors.textPrimary, marginTop: 4 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
    chip: {
      paddingHorizontal: 14,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
    },
    chipText: { fontFamily: fontFamily.sansBold, fontSize: 13.5, color: colors.textPrimary },
    primary: {
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
    },
    primaryText: { fontFamily: fontFamily.sansBold, fontSize: 14.5, color: colors.white },
    sectionLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 26,
    },
    dayRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    check: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkDone: { backgroundColor: colors.navy, borderColor: colors.navy },
    checkMark: { color: colors.white, fontFamily: fontFamily.sansExtraBold, fontSize: 14 },
    dayNumber: { fontFamily: fontFamily.sansExtraBold, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: colors.textMuted },
    dayReading: { fontFamily: fontFamily.serifBold, fontSize: 16, color: colors.textPrimary, marginTop: 1 },
    dayDone: { color: colors.textMuted },
    reset: { alignSelf: "center", marginTop: 24, padding: 10 },
    resetText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.textSecondary },
  });
}
