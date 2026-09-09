import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors } from "@/theme/colors";
import { fontFamily, textStyles } from "@/theme/typography";
import { SearchIcon, BookmarkIcon, HighlightIcon, PlusIcon } from "@/components/icons";
import {
  getVerse,
  getVerseCandidates,
  searchKeyword,
  SAMPLE_CROSS_REFERENCES,
  TRANSLATION,
  VerseResult,
} from "@/data/bible";
import { notesStore } from "@/data/notesStore";
import { newId, SermonNote } from "@/types/note";
import { useAlert } from "@/context/AlertContext";

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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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

  const crossRefs = useMemo(() => {
    const refs = SAMPLE_CROSS_REFERENCES[selected.reference] ?? [];
    return refs
      .map((ref) => getVerseCandidates(ref, 1)[0])
      .filter((v): v is VerseResult => Boolean(v));
  }, [selected.reference]);

  function choose(v: VerseResult) {
    setSelected(v);
    setQuery("");
    setResults([]);
  }

  const showAlert = useAlert();

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
        <View style={styles.translationBadge}>
          <Text style={styles.translationText}>{TRANSLATION.code}</Text>
        </View>
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
          <Text style={textStyles.verseTextLarge}>&ldquo;{selected.text}&rdquo;</Text>

          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={() =>
                showAlert({ title: "Bookmarks", message: "Saving verse bookmarks isn't wired up in this concept build yet." })
              }
              accessibilityRole="button"
              accessibilityLabel="Bookmark this verse"
            >
              <BookmarkIcon size={17} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={() =>
                showAlert({ title: "Highlights", message: "Highlighting verses isn't wired up in this concept build yet." })
              }
              accessibilityRole="button"
              accessibilityLabel="Highlight this verse"
            >
              <HighlightIcon size={17} color={colors.textSecondary} />
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

          {crossRefs.length > 0 ? (
            <View style={{ marginTop: 26 }}>
              <Text style={textStyles.label}>Cross references</Text>
              <View style={styles.chipRow}>
                {crossRefs.map((ref) => (
                  <Pressable key={ref.reference} style={styles.chip} onPress={() => choose(ref)}>
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
    backgroundColor: colors.navy,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
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
