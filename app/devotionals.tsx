import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows } from "@/theme/tokens";
import { ChevronLeftIcon, ChevronRightIcon, CompassIcon } from "@/components/icons";
import { FadeInView, PressableScale } from "@/components/Motion";
import { DEVOTIONALS, devotionalOfTheDay } from "@/data/devotionals";

/** The list of topical devotionals — each opens a short study that walks
 * through connected passages and ends with a prayer. */
export default function DevotionalsScreen() {
  const colors = useColors();
  const shadows = useShadows();
  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);
  const today = devotionalOfTheDay();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Devotionals</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          Short topical studies — each one connects several passages, offers questions to reflect on, and ends with
          a prayer.
        </Text>

        <PressableScale
          style={styles.todayCard}
          onPress={() => router.push(`/devotional/${today.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Today's devotional: ${today.title}`}
        >
          <Text style={styles.todayLabel}>Today&apos;s devotional</Text>
          <Text style={styles.todayTitle}>{today.title}</Text>
          <Text style={styles.todaySummary}>{today.summary}</Text>
          <Text style={styles.todayMeta}>
            {today.passages.length} passages &middot; ends in prayer
          </Text>
        </PressableScale>

        <Text style={styles.sectionLabel}>All topics</Text>
        <View style={{ gap: 10 }}>
          {DEVOTIONALS.map((d, i) => (
            <FadeInView key={d.id} delay={Math.min(i, 8) * 30}>
              <PressableScale
                style={styles.row}
                onPress={() => router.push(`/devotional/${d.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${d.title}: ${d.summary}`}
              >
                <View style={styles.rowIcon}>
                  <CompassIcon size={18} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{d.title}</Text>
                  <Text style={styles.rowSummary}>{d.summary}</Text>
                </View>
                <ChevronRightIcon size={16} color={colors.textFaint} />
              </PressableScale>
            </FadeInView>
          ))}
        </View>
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
    content: { paddingHorizontal: 24, paddingBottom: 40, maxWidth: 680, width: "100%", alignSelf: "center" },
    lead: { fontFamily: fontFamily.sansRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
    todayCard: {
      marginTop: 18,
      backgroundColor: colors.navy,
      borderRadius: radius.lg,
      padding: 20,
      gap: 4,
      ...shadows.sm,
    },
    todayLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 10.5,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.goldLight,
    },
    todayTitle: { fontFamily: fontFamily.serifBold, fontSize: 24, color: colors.white, marginTop: 2 },
    todaySummary: { fontFamily: fontFamily.sansRegular, fontSize: 13.5, color: colors.white, opacity: 0.85 },
    todayMeta: { fontFamily: fontFamily.sansBold, fontSize: 11.5, color: colors.white, opacity: 0.65, marginTop: 8 },
    sectionLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 26,
      marginBottom: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: 14,
      ...shadows.sm,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    rowTitle: { fontFamily: fontFamily.serifSemibold, fontSize: 16, color: colors.textPrimary },
    rowSummary: { fontFamily: fontFamily.sansRegular, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  });
}

