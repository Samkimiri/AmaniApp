import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors, useTextStyles } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "@/components/icons";
import { BOOKS, chapterCount, getChapter, TRANSLATION, useActiveTranslation } from "@/data/bible";
import { saveReadingPosition } from "@/data/readingProgress";

/**
 * A continuous, chapter-at-a-time reading view — distinct from the Bible
 * tab's search/lookup screen, which only ever shows one verse. Reads
 * straight through a whole book using the same bundled, public-domain
 * translations already in the app; no new content, just a different way
 * to move through what's already there.
 */
export default function BibleReadScreen() {
  const params = useLocalSearchParams<{ book?: string; chapter?: string }>();
  const [book, setBook] = useState(params.book && BOOKS.includes(params.book) ? params.book : BOOKS[0]);
  const [chapter, setChapter] = useState(() => {
    const n = Number(params.chapter);
    return Number.isFinite(n) && n > 0 ? n : 1;
  });
  const scrollRef = useRef<ScrollView>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerBook, setPickerBook] = useState<string | null>(null);
  const translationCode = useActiveTranslation();
  const colors = useColors();
  const textStyles = useTextStyles();
  const styles = makeStyles(colors);

  const verses = useMemo(() => getChapter(book, chapter), [book, chapter, translationCode]);
  useEffect(() => {
    saveReadingPosition({ book, chapter });
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [book, chapter]);

  const totalChapters = chapterCount(book);
  const bookIndex = BOOKS.indexOf(book);

  function goToChapter(nextBook: string, nextChapter: number) {
    setBook(nextBook);
    setChapter(nextChapter);
  }

  function previousChapter() {
    if (chapter > 1) {
      goToChapter(book, chapter - 1);
    } else if (bookIndex > 0) {
      const prevBook = BOOKS[bookIndex - 1];
      goToChapter(prevBook, chapterCount(prevBook));
    }
  }

  function nextChapter() {
    if (chapter < totalChapters) {
      goToChapter(book, chapter + 1);
    } else if (bookIndex < BOOKS.length - 1) {
      goToChapter(BOOKS[bookIndex + 1], 1);
    }
  }

  const isFirstChapter = chapter === 1 && bookIndex === 0;
  const isLastChapter = chapter === totalChapters && bookIndex === BOOKS.length - 1;

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
          <ChevronLeftIcon size={20} />
        </Pressable>
        <Pressable
          onPress={() => {
            setPickerBook(book);
            setPickerOpen(true);
          }}
          style={styles.titleButton}
          accessibilityRole="button"
          accessibilityLabel={`${book} chapter ${chapter}, tap to jump to a different book or chapter`}
        >
          <Text style={styles.titleText}>
            {book} {chapter}
          </Text>
          <ChevronDownIcon size={12} strokeWidth={3} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerButton} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.bookHeading}>{book}</Text>
        <Text style={styles.chapterHeading}>Chapter {chapter}</Text>
        <View style={styles.headingRule} />
        <Text style={styles.translationLabel}>{TRANSLATION.name}</Text>
        <Text style={styles.chapterText}>
          {verses.map((v) => (
            <Text key={v.verse}>
              <Text style={styles.verseNumber}>{v.verse} </Text>
              <Text>{v.text} </Text>
            </Text>
          ))}
        </Text>
      </ScrollView>

      <View style={styles.navRow}>
        <Pressable
          onPress={previousChapter}
          disabled={isFirstChapter}
          style={[styles.navButton, isFirstChapter && styles.navButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Previous chapter"
        >
          <ChevronLeftIcon size={16} color={isFirstChapter ? colors.textFaint : colors.textPrimary} />
          <Text style={[styles.navButtonText, isFirstChapter && styles.navButtonTextDisabled]}>Previous</Text>
        </Pressable>
        <Pressable
          onPress={nextChapter}
          disabled={isLastChapter}
          style={[styles.navButton, isLastChapter && styles.navButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Next chapter"
        >
          <Text style={[styles.navButtonText, isLastChapter && styles.navButtonTextDisabled]}>Next</Text>
          <ChevronRightIcon size={16} color={isLastChapter ? colors.textFaint : colors.textPrimary} />
        </Pressable>
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.pickerScrim} onPress={() => setPickerOpen(false)} />
        <View style={styles.pickerSheet}>
          {pickerBook === null ? null : (
            <>
              <View style={styles.pickerHeaderRow}>
                <Pressable
                  onPress={() => setPickerBook(null)}
                  style={styles.pickerBackButton}
                  accessibilityRole="button"
                  accessibilityLabel="Choose a different book"
                >
                  <Text style={styles.pickerBackText}>All books</Text>
                </Pressable>
              </View>
              <Text style={styles.pickerTitle}>{pickerBook}</Text>
              <ScrollView style={styles.chapterGrid} contentContainerStyle={styles.chapterGridContent}>
                {Array.from({ length: chapterCount(pickerBook) }, (_, i) => i + 1).map((c) => (
                  <Pressable
                    key={c}
                    style={styles.chapterCell}
                    onPress={() => {
                      goToChapter(pickerBook, c);
                      setPickerOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${pickerBook} chapter ${c}`}
                  >
                    <Text style={styles.chapterCellText}>{c}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
          {pickerBook === null ? (
            <>
              <Text style={styles.pickerTitle}>Choose a book</Text>
              <ScrollView style={styles.bookList}>
                {BOOKS.map((b) => (
                  <Pressable
                    key={b}
                    style={styles.bookRow}
                    onPress={() => setPickerBook(b)}
                    accessibilityRole="button"
                    accessibilityLabel={b}
                  >
                    <Text style={styles.bookRowText}>{b}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    titleButton: { flexDirection: "row", alignItems: "center", gap: 6 },
    titleText: { fontFamily: fontFamily.serifBold, fontSize: 17, color: colors.textPrimary },
    content: { paddingHorizontal: 24, paddingBottom: 40 },
    bookHeading: { fontFamily: fontFamily.sansExtraBold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: colors.gold, marginTop: 6 },
    chapterHeading: { fontFamily: fontFamily.serifBold, fontSize: 34, color: colors.textPrimary, marginTop: 2 },
    headingRule: { width: 44, height: 3, borderRadius: 2, backgroundColor: colors.gold, marginTop: 12, marginBottom: 16 },
    translationLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.gold,
      marginBottom: 14,
    },
    chapterText: { fontFamily: fontFamily.serifRegular, fontSize: 17, lineHeight: 32, color: colors.textPrimary },
    verseNumber: { fontFamily: fontFamily.sansExtraBold, fontSize: 11, color: colors.gold },
    navRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingHorizontal: 18,
      paddingVertical: 14,
      gap: 10,
    },
    navButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 46,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navButtonDisabled: { opacity: 0.4 },
    navButtonText: { fontFamily: fontFamily.sansBold, fontSize: 13.5, color: colors.textPrimary },
    navButtonTextDisabled: { color: colors.textFaint },
    pickerScrim: { flex: 1, backgroundColor: colors.scrim },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 22,
      paddingTop: 18,
      paddingBottom: 24,
      maxHeight: "75%",
    },
    pickerHeaderRow: { flexDirection: "row", justifyContent: "flex-start" },
    pickerBackButton: { paddingVertical: 4 },
    pickerBackText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.gold },
    pickerTitle: { fontFamily: fontFamily.serifBold, fontSize: 17, color: colors.textPrimary, marginBottom: 10 },
    bookList: { maxHeight: 420 },
    bookRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    bookRowText: { fontFamily: fontFamily.sansBold, fontSize: 14, color: colors.textPrimary },
    chapterGrid: { maxHeight: 360 },
    chapterGridContent: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chapterCell: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    chapterCellText: { fontFamily: fontFamily.sansBold, fontSize: 13.5, color: colors.textPrimary },
  });
}
