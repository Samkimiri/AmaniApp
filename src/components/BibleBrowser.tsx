import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ColorPalette, lightColors } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { BOOKS } from "@/data/bible";
import { useReadingPosition } from "@/data/readingProgress";
import { ChevronRightIcon, OpenBookIcon } from "./icons";

// The bundled canon is the standard 66 books: 39 Old Testament, then
// 27 New Testament (Matthew onward).
const OT_COUNT = 39;

function openChapter(book: string, chapter: number) {
  router.push(`/bible-read?book=${encodeURIComponent(book)}&chapter=${chapter}`);
}

/** A large, friendly entry point into reading: picks up where the reader
 * left off, or starts at Genesis 1 for a first-time reader. */
export function ContinueReadingCard() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const position = useReadingPosition();
  const book = position?.book ?? BOOKS[0];
  const chapter = position?.chapter ?? 1;

  return (
    <Pressable
      onPress={() => openChapter(book, chapter)}
      style={({ pressed }) => [styles.continueCard, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={position ? `Continue reading ${book} ${chapter}` : "Start reading the Bible"}
    >
      <View style={styles.continueIcon}>
        <OpenBookIcon size={22} color={lightColors.goldLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.continueLabel}>{position ? "Continue reading" : "Start reading"}</Text>
        <Text style={styles.continueTitle}>
          {book} {chapter}
        </Text>
      </View>
      <ChevronRightIcon size={20} color={lightColors.goldLight} />
    </Pressable>
  );
}

function BookGroup({ title, books }: { title: string; books: string[] }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.bookGrid}>
        {books.map((b) => (
          <Pressable
            key={b}
            style={({ pressed }) => [styles.bookChip, pressed && { opacity: 0.6 }]}
            onPress={() => openChapter(b, 1)}
            accessibilityRole="button"
            accessibilityLabel={`Read ${b}`}
          >
            <Text style={styles.bookChipText}>{b}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Every book of the Bible, one tap from reading. */
export function BibleBrowser() {
  return (
    <View>
      <BookGroup title="Old Testament" books={BOOKS.slice(0, OT_COUNT)} />
      <BookGroup title="New Testament" books={BOOKS.slice(OT_COUNT)} />
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    continueCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: lightColors.navy, // fixed brand navy in every theme, like the verse-of-the-day card
      borderRadius: 18,
      padding: 18,
      shadowColor: lightColors.navyDark,
      shadowOpacity: 0.25,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    continueIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "rgba(255,255,255,0.14)",
      alignItems: "center",
      justifyContent: "center",
    },
    continueLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 10.5,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "#E8D9A8",
    },
    continueTitle: { fontFamily: fontFamily.serifBold, fontSize: 22, color: "#FFFFFF", marginTop: 2 },
    groupTitle: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.textMuted,
    },
    bookGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    bookChip: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 13,
    },
    bookChipText: { fontFamily: fontFamily.sansSemibold, fontSize: 12.5, color: colors.textPrimary },
  });
}
