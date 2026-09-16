import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors } from "@/theme/colors";
import { fontFamily, textStyles } from "@/theme/typography";
import { SearchIcon, BookmarkIcon, ChevronDownIcon, HighlightIcon, PlusIcon } from "@/components/icons";
import {
  AVAILABLE_TRANSLATIONS,
  ensureCrossReferencesLoaded,
  getCrossReferences,
  getVerse,
  getVerseCandidates,
  searchKeyword,
  setActiveTranslation,
  TRANSLATION,
  useActiveTranslation,
  VerseResult,
} from "@/data/bible";
import { notesStore } from "@/data/notesStore";
import { bookmarks, highlights, VerseMark } from "@/data/verseMarks";
import { newId, SermonNote } from "@/types/note";

const DEFAULT_VERSE: VerseResult = {
  book: "John",
  chapter: 3,
  verse: 16,
  text: getVerse("John", 3, 16) ?? "",
  reference: "John 3:16",
};

export default function BibleScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VerseResult[]>([]);
  const [selected, setSelected] = useState<VerseResult>(DEFAULT_VERSE);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [savedBookmarks, setSavedBookmarks] = useState<VerseMark[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const translationCode = useActiveTranslation();
  const [switchingTranslation, setSwitchingTranslation] = useState(false);

  async function switchTranslation() {
    const idx = AVAILABLE_TRANSLATIONS.findIndex((t) => t.code === translationCode);
    const next = AVAILABLE_TRANSLATIONS[(idx + 1) % AVAILABLE_TRANSLATIONS.length];
    // The very first switch to a not-yet-used translation reads and
    // parses a multi-MB file, so this isn't always instant.
    setSwitchingTranslation(true);
    await setActiveTranslation(next.code);
    setSwitchingTranslation(false);
  }

  // Re-fetch the currently viewed verse's text when the translation
  // changes, rather than resetting back to the default verse.
  useEffect(() => {
    const text = getVerse(selected.book, selected.chapter, selected.verse);
    if (text !== undefined) setSelected((s) => ({ ...s, text }));
    if (query.trim()) {
      const asReference = getVerseCandidates(query, 8);
      setResults(asReference.length > 0 ? asReference : searchKeyword(query, 20));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationCode]);

  useEffect(() => {
    bookmarks.isMarked(selected.reference).then(setIsBookmarked);
    highlights.isMarked(selected.reference).then(setIsHighlighted);
  }, [selected.reference]);

  useEffect(() => {
    bookmarks.getAll().then(setSavedBookmarks);
  }, [isBookmarked]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const asReference = getVerseCandidates(query, 8);
      setResults(asReference.length > 0 ? asReference : searchKeyword(query, 20));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const [crossRefsReady, setCrossRefsReady] = useState(false);
  useEffect(() => {
    ensureCrossReferencesLoaded().then(() => setCrossRefsReady(true));
  }, []);

  const crossRefs = useMemo(() => {
    const refs = getCrossReferences(selected.reference);
    return refs
      .map((ref) => getVerseCandidates(ref, 1)[0])
      .filter((v): v is VerseResult => Boolean(v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.reference, translationCode, crossRefsReady]);

  function choose(v: VerseResult) {
    setSelected(v);
    setQuery("");
    setResults([]);
  }

  async function toggleBookmark() {
    const nowBookmarked = await bookmarks.toggle(selected);
    setIsBookmarked(nowBookmarked);
  }

  async function toggleHighlight() {
    const nowHighlighted = await highlights.toggle(selected);
    setIsHighlighted(nowHighlighted);
  }

  async function addSelectedVerseToNewNote() {
    const now = new Date().toISOString();
    const id = newId();
    const note: SermonNote = {
      id,
      title: "",
      church: "",
      date: new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      blocks: [
        { id: newId(), type: "verse", reference: selected.reference, text: selected.text },
        { id: newId(), type: "text", text: "" },
      ],
      createdAt: now,
      updatedAt: now,
    };
    await notesStore.save(note);
    router.push(`/note/${id}`);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={textStyles.screenTitle}>Bible</Text>
        <Pressable
          style={[styles.translationBadge, switchingTranslation && { opacity: 0.6 }]}
          onPress={switchTranslation}
          disabled={switchingTranslation}
          accessibilityRole="button"
          accessibilityLabel={`Switch translation, currently ${TRANSLATION.code}`}
        >
          <Text style={styles.translationText}>{switchingTranslation ? "Loading…" : TRANSLATION.code}</Text>
          {switchingTranslation ? null : <ChevronDownIcon size={12} strokeWidth={3} />}
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <SearchIcon size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder='Search or type a reference — "Jn 3:16"'
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
        />
      </View>

      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(r) => r.reference}
          style={{ marginTop: 10, maxHeight: 260 }}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={styles.resultRow} onPress={() => choose(item)}>
              <Text style={styles.resultRef}>{item.reference}</Text>
              <Text style={styles.resultText} numberOfLines={1}>
                {item.text}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.reference}>{selected.reference}</Text>
          <View style={[styles.verseTextWrap, isHighlighted && styles.verseTextWrapHighlighted]}>
            <Text style={textStyles.verseTextLarge}>&ldquo;{selected.text}&rdquo;</Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                isBookmarked && styles.actionButtonActive,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={toggleBookmark}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? "Remove bookmark" : "Bookmark this verse"}
            >
              <BookmarkIcon size={17} color={isBookmarked ? colors.gold : colors.textSecondary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                isHighlighted && styles.actionButtonActive,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={toggleHighlight}
              accessibilityRole="button"
              accessibilityLabel={isHighlighted ? "Remove highlight" : "Highlight this verse"}
            >
              <HighlightIcon size={17} color={isHighlighted ? colors.gold : colors.textSecondary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={addSelectedVerseToNewNote}
              accessibilityRole="button"
              accessibilityLabel="Add this verse to a new note"
            >
              <PlusIcon size={17} color={colors.navy} strokeWidth={2} />
            </Pressable>
          </View>

          {savedBookmarks.length > 0 ? (
            <View style={{ marginTop: 26 }}>
              <Text style={textStyles.label}>Your bookmarks</Text>
              <View style={styles.chipRow}>
                {savedBookmarks.map((mark) => (
                  <Pressable
                    key={mark.reference}
                    style={styles.chip}
                    onPress={() => {
                      const resolved = getVerseCandidates(mark.reference, 1)[0];
                      if (resolved) choose(resolved);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Go to bookmark ${mark.reference}`}
                  >
                    <Text style={styles.chipText}>{mark.reference}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {crossRefs.length > 0 ? (
            <View style={{ marginTop: 26 }}>
              <Text style={textStyles.label}>Cross references</Text>
              <View style={styles.chipRow}>
                {crossRefs.map((ref) => (
                  <Pressable
                    key={ref.reference}
                    style={styles.chip}
                    onPress={() => choose(ref)}
                    accessibilityRole="button"
                    accessibilityLabel={`Go to cross reference ${ref.reference}`}
                  >
                    <Text style={styles.chipText}>{ref.reference}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  translationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.navy,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
  },
  actionButtonPressed: { opacity: 0.6 },
  translationText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.white },
  searchBar: {
    marginHorizontal: 24,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontFamily: fontFamily.sansRegular, fontSize: 13.5, color: colors.textPrimary },
  content: { padding: 24, paddingBottom: 60 },
  reference: {
    fontFamily: fontFamily.sansExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.gold,
    marginBottom: 8,
  },
  verseTextWrap: { borderRadius: 12 },
  verseTextWrapHighlighted: {
    backgroundColor: colors.verseBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: -12,
  },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonActive: { backgroundColor: colors.verseBg, borderColor: "#F0E1BC" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    height: 36,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontFamily: fontFamily.sansSemibold, fontSize: 12, color: colors.textSecondary },
  resultRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    minHeight: 44,
    justifyContent: "center",
  },
  resultRef: { fontFamily: fontFamily.sansBold, fontSize: 13, color: colors.navy, marginBottom: 2 },
  resultText: { fontFamily: fontFamily.sansRegular, fontSize: 13, color: colors.textSecondary },
});
