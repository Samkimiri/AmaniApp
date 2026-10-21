import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows } from "@/theme/tokens";
import { ChevronLeftIcon, ChevronRightIcon, NotesIcon, OpenBookIcon } from "@/components/icons";
import { getDevotional, resolvePassage } from "@/data/devotionals";
import { useActiveTranslation } from "@/data/bible";

/** One topical devotional: intro → connected passages → reflection → prayer. */
export default function DevotionalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const devotional = getDevotional(id);
  const translationCode = useActiveTranslation();
  const colors = useColors();
  const shadows = useShadows();
  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);

  const passages = useMemo(
    () => (devotional ? devotional.passages.map(resolvePassage) : []),
    // resolvePassage reads the active Bible; translationCode is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [devotional, translationCode]
  );

  const related = useMemo(
    () => (devotional?.related ?? []).map((r) => getDevotional(r)).filter((d): d is NonNullable<typeof d> => !!d),
    [devotional]
  );

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace("/devotionals");
  }

  if (!devotional) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={back} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Back">
            <ChevronLeftIcon size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Devotional not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  function writeReflection() {
    if (!devotional) return;
    const firstRef = passages[0]?.reference ?? "";
    router.push(
      `/note/new?template=soap&initialTitle=${encodeURIComponent(
        `Devotional: ${devotional.title}`
      )}&initialSeries=${encodeURIComponent("Devotionals")}&initialVerse=${encodeURIComponent(firstRef)}`
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={back}
          style={styles.headerButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Devotional</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Topical study</Text>
        <Text style={styles.title}>{devotional.title}</Text>
        <View style={styles.rule} />
        <Text style={styles.intro}>{devotional.intro}</Text>

        <Text style={styles.sectionLabel}>Scripture</Text>
        <View style={{ gap: 14 }}>
          {passages.map((p, i) => (
            <View key={`${p.reference}-${i}`} style={styles.passageCard}>
              <View style={styles.passageHeader}>
                <Text style={styles.passageNumber}>{i + 1}</Text>
                <Text style={styles.passageRef}>{p.reference}</Text>
                {p.book ? (
                  <Pressable
                    onPress={() =>
                      router.push(
                        `/bible-read?book=${encodeURIComponent(p.book!)}&chapter=${p.chapter}&verse=${p.verse}${
                          p.endVerse ? `&endVerse=${p.endVerse}` : ""
                        }`
                      )
                    }
                    hitSlop={8}
                    style={styles.readButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Read ${p.reference} in context`}
                  >
                    <OpenBookIcon size={13} color={colors.verseText} />
                    <Text style={styles.readButtonText}>Read</Text>
                  </Pressable>
                ) : null}
              </View>
              {p.text ? <Text style={styles.passageText}>&ldquo;{p.text}&rdquo;</Text> : null}
              <Text style={styles.insight}>{p.insight}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Reflect</Text>
        <View style={styles.reflectCard}>
          {devotional.reflection.map((q, i) => (
            <View key={i} style={styles.reflectRow}>
              <Text style={styles.reflectBullet}>{i + 1}.</Text>
              <Text style={styles.reflectText}>{q}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Prayer</Text>
        <View style={styles.prayerCard}>
          <Text style={styles.prayerText}>{devotional.prayer}</Text>
        </View>

        <Pressable
          onPress={writeReflection}
          style={({ pressed }) => [styles.writeButton, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Write a reflection note on this devotional"
        >
          <NotesIcon size={16} color={colors.white} />
          <Text style={styles.writeButtonText}>Write a reflection</Text>
        </Pressable>

        {related.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Continue studying</Text>
            <View style={{ gap: 10 }}>
              {related.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/devotional/${r.id}`)}
                  style={({ pressed }) => [styles.relatedRow, pressed && { opacity: 0.8 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.title}: ${r.summary}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.relatedTitle}>{r.title}</Text>
                    <Text style={styles.relatedSummary}>{r.summary}</Text>
                  </View>
                  <ChevronRightIcon size={16} color={colors.textFaint} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette, shadows: Shadows) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingBottom: 8,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },
    headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: fontFamily.serifBold, fontSize: 17, color: colors.textPrimary },
    content: { paddingHorizontal: 24, paddingBottom: 48, maxWidth: 680, width: "100%", alignSelf: "center" },
    kicker: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.gold,
      marginTop: 6,
    },
    title: { fontFamily: fontFamily.serifBold, fontSize: 32, color: colors.textPrimary, marginTop: 2 },
    rule: { width: 44, height: 3, borderRadius: 2, backgroundColor: colors.gold, marginTop: 12, marginBottom: 16 },
    intro: { fontFamily: fontFamily.serifRegular, fontSize: 16, lineHeight: 26, color: colors.textSecondary },
    sectionLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 28,
      marginBottom: 12,
    },
    passageCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: 16,
      gap: 8,
      ...shadows.sm,
    },
    passageHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    passageNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.verseBg,
      textAlign: "center",
      lineHeight: 22,
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11,
      color: colors.verseText,
      overflow: "hidden",
    },
    passageRef: {
      flex: 1,
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.navy,
    },
    readButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.verseBg,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    readButtonText: { fontFamily: fontFamily.sansBold, fontSize: 11, color: colors.verseText },
    passageText: {
      fontFamily: fontFamily.serifItalic,
      fontSize: 16,
      lineHeight: 25,
      color: colors.textPrimary,
    },
    insight: { fontFamily: fontFamily.sansRegular, fontSize: 13, lineHeight: 19, color: colors.textMuted },
    reflectCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: 16,
      gap: 12,
    },
    reflectRow: { flexDirection: "row", gap: 10 },
    reflectBullet: { fontFamily: fontFamily.sansExtraBold, fontSize: 13.5, color: colors.gold, width: 18 },
    reflectText: { flex: 1, fontFamily: fontFamily.sansRegular, fontSize: 14, lineHeight: 21, color: colors.textPrimary },
    prayerCard: {
      backgroundColor: colors.verseBg,
      borderLeftWidth: 3,
      borderLeftColor: colors.gold,
      borderRadius: radius.md,
      padding: 18,
    },
    prayerText: {
      fontFamily: fontFamily.serifItalic,
      fontSize: 16,
      lineHeight: 26,
      color: colors.verseText,
    },
    writeButton: {
      marginTop: 22,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.navy,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    writeButtonText: { fontFamily: fontFamily.sansBold, fontSize: 14, color: colors.white },
    relatedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 14,
    },
    relatedTitle: { fontFamily: fontFamily.serifSemibold, fontSize: 15, color: colors.textPrimary },
    relatedSummary: { fontFamily: fontFamily.sansRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  });
}

