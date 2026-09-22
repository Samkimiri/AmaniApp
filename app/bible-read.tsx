import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import {
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  SpeakerIcon,
  StopIcon,
} from "@/components/icons";
import {
  BOOKS,
  chapterCount,
  formatReference,
  getChapter,
  TRANSLATION,
  useActiveTranslation,
  VerseResult,
} from "@/data/bible";
import { getReadingPosition, saveReadingPosition } from "@/data/readingProgress";
import { markChapterRead } from "@/data/readingStats";
import { bookmarks, highlights } from "@/data/verseMarks";
import {
  LINE_SPACING_RATIO,
  ReaderLayout,
  ReaderSettings,
  TEXT_SIZE_PX,
  updateReaderSettings,
  useReaderSettings,
} from "@/data/readerSettings";
import { getHighlightColor } from "@/theme/highlightColors";
import { TranslationPicker } from "@/components/TranslationPicker";
import { VerseActionSheet } from "@/components/VerseActionSheet";
import { ReaderSettingsSheet } from "@/components/ReaderSettingsSheet";

/**
 * A continuous, chapter-at-a-time reading view — distinct from the Bible
 * tab's search/lookup screen, which only ever shows one verse. Reads
 * straight through a whole book using the same bundled, public-domain
 * translations already in the app; no new content, just a different way
 * to move through what's already there.
 */
export default function BibleReadScreen() {
  const params = useLocalSearchParams<{ book?: string; chapter?: string; verse?: string; endVerse?: string }>();
  const [book, setBook] = useState(params.book && BOOKS.includes(params.book) ? params.book : BOOKS[0]);
  const [chapter, setChapter] = useState(() => {
    const n = Number(params.chapter);
    return Number.isFinite(n) && n > 0 ? n : 1;
  });
  // Arriving with no book/chapter at all (e.g. the installed app's
  // "Continue reading" shortcut) resumes the last chapter read. Reads the
  // saved position directly, once, rather than via a subscription — the
  // effect below that *writes* the position must not fire with the
  // Genesis-1 default before this has had a chance to apply, or it would
  // overwrite the very position it's trying to resume.
  const [ready, setReady] = useState(!!params.book);
  useEffect(() => {
    if (params.book) return;
    let cancelled = false;
    getReadingPosition().then((pos) => {
      if (cancelled) return;
      if (pos) {
        setBook(pos.book);
        setChapter(pos.chapter);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Verse(s) to spotlight when arriving from a scripture reference in a
  // note; cleared as soon as the reader moves to another chapter.
  const [focus, setFocus] = useState<{ start: number; end: number } | null>(() => {
    const start = Number(params.verse);
    if (!Number.isFinite(start) || start < 1) return null;
    const end = Number(params.endVerse);
    return { start, end: Number.isFinite(end) && end > start ? end : start };
  });
  const scrollRef = useRef<ScrollView>(null);
  const versesTop = useRef(0);
  const paragraphHeight = useRef(0);
  const rowTops = useRef<Record<number, number>>({});
  const settings = useReaderSettings();
  const { layout } = settings;
  const [versionPickerOpen, setVersionPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerBook, setPickerBook] = useState<string | null>(null);
  const [actionVerse, setActionVerse] = useState<VerseResult | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [highlightMap, setHighlightMap] = useState<Record<string, string | undefined>>({});
  const [bookmarkSet, setBookmarkSet] = useState<Set<string>>(new Set());
  const translationCode = useActiveTranslation();
  const colors = useColors();
  const styles = makeStyles(colors, settings);

  const refreshMarks = useCallback(() => {
    highlights.getAll().then((list) => setHighlightMap(Object.fromEntries(list.map((m) => [m.reference, m.color]))));
    bookmarks.getAll().then((list) => setBookmarkSet(new Set(list.map((m) => m.reference))));
  }, []);
  useEffect(refreshMarks, [refreshMarks]);

  function chooseLayout(next: ReaderLayout) {
    updateReaderSettings({ layout: next });
  }

  // Read the chapter aloud with the device's own text-to-speech (no
  // audio files shipped, works fully offline). Stops automatically if the
  // reader navigates elsewhere or unmounts, so it never keeps talking
  // over a chapter no longer on screen.
  function toggleSpeech() {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = verses
      .filter((v) => !v.text.startsWith("["))
      .map((v) => v.text)
      .join(" ");
    if (!text) return;
    setSpeaking(true);
    Speech.speak(`${book}, chapter ${chapter}. ${text}`, {
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  useEffect(() => {
    Speech.stop();
    setSpeaking(false);
  }, [book, chapter]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const verses = useMemo(() => getChapter(book, chapter), [book, chapter, translationCode]);
  useEffect(() => {
    if (!ready) return;
    saveReadingPosition({ book, chapter });
    markChapterRead(book, chapter);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    rowTops.current = {};
  }, [book, chapter, ready]);

  // Bring the spotlighted verse into view once the chapter has laid out.
  useEffect(() => {
    if (!focus) return;
    const timer = setTimeout(() => {
      let y: number | undefined;
      if (layout === "verses") {
        const top = rowTops.current[focus.start];
        if (top !== undefined) y = versesTop.current + top;
      } else {
        const before = verses.filter((v) => v.verse < focus.start).reduce((n, v) => n + v.text.length, 0);
        const total = verses.reduce((n, v) => n + v.text.length, 0) || 1;
        y = versesTop.current + (before / total) * paragraphHeight.current;
      }
      if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 90), animated: true });
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, book, chapter, layout]);

  const totalChapters = chapterCount(book);
  const bookIndex = BOOKS.indexOf(book);

  function goToChapter(nextBook: string, nextChapter: number) {
    setFocus(null);
    setBook(nextBook);
    setChapter(nextChapter);
  }

  function openVerse(verse: number, text: string) {
    if (text.startsWith("[")) return; // translator's note, not a verse
    setActionVerse({
      book,
      chapter,
      verse,
      text,
      reference: formatReference(book, chapter, verse),
    });
  }

  function verseMark(verse: number) {
    const ref = formatReference(book, chapter, verse);
    return { color: highlightMap[ref], hasHighlight: ref in highlightMap, bookmarked: bookmarkSet.has(ref) };
  }

  function isFocused(verse: number) {
    return !!focus && verse >= focus.start && verse <= focus.end;
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
        <View style={styles.headerRight}>
          <Pressable
            onPress={toggleSpeech}
            style={[styles.settingsButton, speaking && styles.settingsButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={speaking ? "Stop reading aloud" : "Read this chapter aloud"}
          >
            {speaking ? (
              <StopIcon size={13} color={colors.white} />
            ) : (
              <SpeakerIcon size={16} color={colors.textPrimary} />
            )}
          </Pressable>
          <Pressable
            onPress={() => setSettingsOpen(true)}
            style={styles.settingsButton}
            accessibilityRole="button"
            accessibilityLabel="Reading settings: text size, spacing and font"
          >
            <Text style={styles.settingsButtonText}>Aa</Text>
          </Pressable>
          <Pressable
            onPress={() => setVersionPickerOpen(true)}
            style={styles.versionChip}
            accessibilityRole="button"
            accessibilityLabel={`Bible version, currently ${TRANSLATION.code}. Tap to change.`}
          >
            <Text style={styles.versionChipText}>{TRANSLATION.code}</Text>
            <ChevronDownIcon size={10} strokeWidth={3} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.bookHeading}>{book}</Text>
        <Text style={styles.chapterHeading}>Chapter {chapter}</Text>
        <View style={styles.headingRule} />
        <View style={styles.metaRow}>
          <Text style={styles.translationLabel}>{TRANSLATION.name}</Text>
          <View style={styles.layoutToggle}>
            {(["verses", "paragraph"] as ReaderLayout[]).map((l) => (
              <Pressable
                key={l}
                onPress={() => chooseLayout(l)}
                style={[styles.layoutOption, layout === l && styles.layoutOptionActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: layout === l }}
                accessibilityLabel={l === "verses" ? "Show one verse per line" : "Show as a flowing paragraph"}
              >
                <Text style={[styles.layoutOptionText, layout === l && styles.layoutOptionTextActive]}>
                  {l === "verses" ? "Verses" : "Paragraph"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={styles.tapHint}>Tap a verse to highlight, bookmark, copy or share it.</Text>
        {layout === "verses" ? (
          <View onLayout={(e) => (versesTop.current = e.nativeEvent.layout.y)}>
            {verses.map((v) => {
              const isNote = v.text.startsWith("[");
              const mark = verseMark(v.verse);
              const hl = mark.hasHighlight ? getHighlightColor(mark.color) : null;
              return (
                <Pressable
                  key={v.verse}
                  onPress={() => openVerse(v.verse, v.text)}
                  onLayout={(e) => (rowTops.current[v.verse] = e.nativeEvent.layout.y)}
                  disabled={isNote}
                  style={[
                    styles.verseRow,
                    hl && { backgroundColor: hl.background },
                    isFocused(v.verse) && styles.verseFocused,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Verse ${v.verse}. ${isNote ? "" : "Tap for options. "}${v.text}`}
                >
                  <View style={styles.verseGutter}>
                    <Text style={styles.verseGutterText}>{v.verse}</Text>
                    {mark.bookmarked ? <BookmarkIcon size={11} color={colors.gold} /> : null}
                  </View>
                  <Text style={[styles.verseBody, isNote && styles.verseNote, hl && { color: hl.text }]}>{v.text}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text
            style={styles.chapterText}
            onLayout={(e) => {
              versesTop.current = e.nativeEvent.layout.y;
              paragraphHeight.current = e.nativeEvent.layout.height;
            }}
          >
            {verses.map((v) => {
              const isNote = v.text.startsWith("[");
              const mark = verseMark(v.verse);
              const hl = mark.hasHighlight ? getHighlightColor(mark.color) : null;
              return (
                <Text
                  key={v.verse}
                  onPress={() => openVerse(v.verse, v.text)}
                  style={[
                    hl && { backgroundColor: hl.background, color: hl.text },
                    isFocused(v.verse) && styles.paragraphFocused,
                  ]}
                >
                  <Text style={styles.verseNumber}>{v.verse}{mark.bookmarked ? "★" : ""} </Text>
                  <Text>{v.text} </Text>
                </Text>
              );
            })}
          </Text>
        )}
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

      <TranslationPicker visible={versionPickerOpen} onClose={() => setVersionPickerOpen(false)} />
      <ReaderSettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <VerseActionSheet verse={actionVerse} onClose={() => setActionVerse(null)} onChanged={refreshMarks} />

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

function makeStyles(colors: ColorPalette, settings: ReaderSettings) {
  const size = TEXT_SIZE_PX[settings.textSize];
  const lineHeight = Math.round(size * LINE_SPACING_RATIO[settings.lineSpacing]);
  const numberSize = Math.max(11, Math.round(size * 0.62));
  const bodyFont = settings.font === "serif" ? fontFamily.serifRegular : fontFamily.sansRegular;
  const noteFont = settings.font === "serif" ? fontFamily.serifItalic : fontFamily.sansRegular;
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
    metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 18 },
    layoutToggle: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 999, borderWidth: 1, borderColor: colors.border, padding: 3 },
    layoutOption: { paddingHorizontal: 12, height: 28, borderRadius: 999, alignItems: "center", justifyContent: "center" },
    layoutOptionActive: { backgroundColor: colors.navy },
    layoutOptionText: { fontFamily: fontFamily.sansBold, fontSize: 11.5, color: colors.textSecondary },
    layoutOptionTextActive: { color: colors.white },
    tapHint: { fontFamily: fontFamily.sansRegular, fontSize: 12, color: colors.textMuted, marginBottom: 14 },
    verseRow: { flexDirection: "row", marginBottom: 4, paddingVertical: 4, paddingRight: 6, marginLeft: -9, paddingLeft: 6, borderLeftWidth: 3, borderLeftColor: "transparent", borderRadius: 10 },
    verseFocused: { borderLeftColor: colors.gold, backgroundColor: colors.verseBg },
    paragraphFocused: { backgroundColor: colors.verseBg },
    verseGutter: { width: numberSize * 2 + 8, alignItems: "flex-start", paddingTop: Math.max(0, (lineHeight - numberSize) / 2 - 2), gap: 3 },
    verseGutterText: { fontFamily: fontFamily.sansExtraBold, fontSize: numberSize, color: colors.gold },
    verseBody: { flex: 1, fontFamily: bodyFont, fontSize: size, lineHeight, color: colors.textPrimary },
    verseNote: { fontFamily: noteFont, fontStyle: "italic", fontSize: Math.round(size * 0.85), lineHeight: Math.round(lineHeight * 0.85), color: colors.textMuted },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: 8 },
    settingsButton: { minWidth: 44, height: 34, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10 },
    settingsButtonActive: { backgroundColor: colors.navy, borderColor: colors.navy },
    settingsButtonText: { fontFamily: fontFamily.serifBold, fontSize: 14, color: colors.textPrimary },
    versionChip: { minWidth: 62, height: 34, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 999, backgroundColor: colors.navy, paddingHorizontal: 12 },
    versionChipText: { fontFamily: fontFamily.sansBold, fontSize: 12, color: colors.white },
    translationLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.gold,
      flex: 1,
    },
    chapterText: { fontFamily: bodyFont, fontSize: size, lineHeight: Math.round(lineHeight * 1.05), color: colors.textPrimary },
    verseNumber: { fontFamily: fontFamily.sansExtraBold, fontSize: numberSize, color: colors.gold },
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
