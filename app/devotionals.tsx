import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows } from "@/theme/tokens";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CompassIcon,
  SearchIcon,
} from "@/components/icons";
import { FadeInView, PressableScale } from "@/components/Motion";
import {
  DEVOTIONAL_CATEGORIES,
  DevotionalCategory,
  devotionalOfTheDay,
  getRandomDevotional,
  searchDevotionals,
} from "@/data/devotionals";

/** The list of topical devotionals — endless daily studies that walk
 * through connected passages and end with prayer, working 100% offline. */
export default function DevotionalsScreen() {
  const colors = useColors();
  const shadows = useShadows();
  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DevotionalCategory | "All">("All");

  const today = useMemo(() => devotionalOfTheDay(), []);
  const todayFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }, []);

  const filteredTopics = useMemo(
    () => searchDevotionals(search, selectedCategory),
    [search, selectedCategory]
  );

  function handleSurpriseMe() {
    const random = getRandomDevotional(today.id);
    router.push(`/devotional/${random.id}`);
  }

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
        <Text style={styles.headerTitle}>Daily Devotionals</Text>
        <Pressable
          onPress={handleSurpriseMe}
          style={styles.headerButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Surprise me with a random devotional"
        >
          <CompassIcon size={20} color={colors.gold} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          Scripture-anchored daily studies — each connects multiple passages, prompts personal reflection, and closes
          with prayer. 100% offline.
        </Text>

        {/* Today's Devotional Hero Card */}
        <PressableScale
          style={styles.todayCard}
          onPress={() => router.push(`/devotional/${today.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Today's devotional: ${today.title}`}
        >
          <View style={styles.todayTopRow}>
            <Text style={styles.todayLabel}>Today &middot; {todayFormatted}</Text>
            {today.category ? (
              <View style={styles.categoryBadgeGold}>
                <Text style={styles.categoryBadgeTextGold}>{today.category}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.todayTitle}>{today.title}</Text>
          <Text style={styles.todaySummary}>{today.summary}</Text>
          <View style={styles.todayFooter}>
            <Text style={styles.todayMeta}>
              {today.passages.length} passages &middot; Guided reflection &middot; Prayer
            </Text>
            <View style={styles.readTodayButton}>
              <Text style={styles.readTodayButtonText}>Begin &rarr;</Text>
            </View>
          </View>
        </PressableScale>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search topics, passages, keywords..."
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} hitSlop={6} accessibilityLabel="Clear search">
              <CloseIcon size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <Pressable
            onPress={() => setSelectedCategory("All")}
            style={[
              styles.categoryChip,
              selectedCategory === "All" && styles.categoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === "All" && styles.categoryChipTextActive,
              ]}
            >
              All Topics
            </Text>
          </Pressable>
          {DEVOTIONAL_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section Header with count */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>
            {selectedCategory === "All" ? "All topics" : selectedCategory}
          </Text>
          <Text style={styles.countLabel}>
            {filteredTopics.length} {filteredTopics.length === 1 ? "study" : "studies"}
          </Text>
        </View>

        {filteredTopics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matching studies found</Text>
            <Text style={styles.emptyText}>
              Try searching for another topic like &ldquo;peace&rdquo;, &ldquo;faith&rdquo;, or &ldquo;prayer&rdquo;.
            </Text>
            <Pressable
              onPress={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>View all devotionals</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredTopics.map((d, i) => (
              <FadeInView key={d.id} delay={Math.min(i, 8) * 20}>
                <PressableScale
                  style={styles.row}
                  onPress={() => router.push(`/devotional/${d.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.title}: ${d.summary}`}
                >
                  <View style={styles.rowIcon}>
                    <CompassIcon size={18} color={colors.navy} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.rowTitleRow}>
                      <Text style={styles.rowTitle}>{d.title}</Text>
                      {d.category ? (
                        <View style={styles.rowCategoryBadge}>
                          <Text style={styles.rowCategoryBadgeText}>{d.category}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.rowSummary}>{d.summary}</Text>
                    <Text style={styles.rowMeta}>
                      {d.passages.length} passages &middot; {d.related.length} connected topics
                    </Text>
                  </View>
                  <ChevronRightIcon size={16} color={colors.textFaint} />
                </PressableScale>
              </FadeInView>
            ))}
          </View>
        )}
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
    content: { paddingHorizontal: 20, paddingBottom: 40, maxWidth: 680, width: "100%", alignSelf: "center" },
    lead: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    todayCard: {
      marginTop: 14,
      backgroundColor: colors.navy,
      borderRadius: radius.lg,
      padding: 18,
      gap: 6,
      ...shadows.sm,
    },
    todayTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    todayLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 10.5,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.goldLight,
    },
    categoryBadgeGold: {
      backgroundColor: "rgba(212, 175, 55, 0.18)",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    categoryBadgeTextGold: {
      fontFamily: fontFamily.sansBold,
      fontSize: 10,
      color: colors.goldLight,
    },
    todayTitle: { fontFamily: fontFamily.serifBold, fontSize: 24, color: colors.white, marginTop: 2 },
    todaySummary: { fontFamily: fontFamily.sansRegular, fontSize: 13.5, color: colors.white, opacity: 0.88 },
    todayFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "rgba(255, 255, 255, 0.12)",
    },
    todayMeta: {
      fontFamily: fontFamily.sansMedium,
      fontSize: 11.5,
      color: colors.white,
      opacity: 0.7,
      flex: 1,
    },
    readTodayButton: {
      backgroundColor: colors.gold,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    readTodayButtonText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 11.5,
      color: colors.navyDark,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 16,
      ...shadows.sm,
    },
    searchInput: {
      flex: 1,
      fontFamily: fontFamily.sansRegular,
      fontSize: 14,
      color: colors.textPrimary,
      padding: 0,
    },
    categoriesScroll: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 14,
    },
    categoryChip: {
      paddingHorizontal: 13,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    categoryChipText: {
      fontFamily: fontFamily.sansMedium,
      fontSize: 12,
      color: colors.textSecondary,
    },
    categoryChipTextActive: {
      fontFamily: fontFamily.sansBold,
      color: colors.white,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6,
      marginBottom: 10,
    },
    sectionLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.textMuted,
    },
    countLabel: {
      fontFamily: fontFamily.sansMedium,
      fontSize: 11,
      color: colors.textMuted,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
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
    rowTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    rowTitle: { fontFamily: fontFamily.serifSemibold, fontSize: 16, color: colors.textPrimary },
    rowCategoryBadge: {
      backgroundColor: colors.verseBg,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    rowCategoryBadgeText: {
      fontFamily: fontFamily.sansMedium,
      fontSize: 9.5,
      color: colors.verseText,
    },
    rowSummary: { fontFamily: fontFamily.sansRegular, fontSize: 12.5, color: colors.textSecondary, marginTop: 1 },
    rowMeta: { fontFamily: fontFamily.sansRegular, fontSize: 10.5, color: colors.textFaint, marginTop: 3 },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      paddingHorizontal: 20,
      gap: 8,
    },
    emptyTitle: {
      fontFamily: fontFamily.serifBold,
      fontSize: 17,
      color: colors.textPrimary,
    },
    emptyText: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 18,
    },
    resetButton: {
      marginTop: 10,
      backgroundColor: colors.verseBg,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    resetButtonText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 12,
      color: colors.verseText,
    },
  });
}
