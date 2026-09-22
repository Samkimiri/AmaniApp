import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors, useTextStyles } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { SearchIcon } from "@/components/icons";
import { NoteCard } from "@/components/NoteCard";
import { SwipeToDelete } from "@/components/SwipeToDelete";
import { useNotes } from "@/hooks/useNotes";
import { notesStore } from "@/data/notesStore";
import { useAlert } from "@/context/AlertContext";
import { SermonNote } from "@/types/note";

function noteSearchText(note: SermonNote): string {
  return [
    note.title,
    note.church,
    note.preacher,
    note.date,
    ...(note.tags ?? []),
    ...note.blocks.map((b) => {
      if (b.type === "text" || b.type === "heading") return b.text;
      if (b.type === "verse") return `${b.reference} ${b.text}`;
      if (b.type === "audio") return b.transcript ?? "";
      if (b.type === "checklist") return b.items.map((i) => i.text).join(" ");
      return "";
    }),
  ]
    .join(" ")
    .toLowerCase();
}

export default function NotesScreen() {
  const { notes, reload } = useNotes();
  const showAlert = useAlert();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const colors = useColors();
  const textStyles = useTextStyles();
  const styles = makeStyles(colors);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => (n.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (activeTag && !(n.tags ?? []).includes(activeTag)) return false;
      if (!q) return true;
      return noteSearchText(n).includes(q);
    });
  }, [notes, query, activeTag]);

  function confirmDelete(id: string, title: string) {
    showAlert({
      title: "Delete this note?",
      message: `"${title || "Untitled note"}" will be permanently deleted from this device. This can't be undone.`,
      actions: [
        {
          label: "Delete",
          style: "destructive",
          onPress: async () => {
            await notesStore.remove(id);
            reload();
          },
        },
        { label: "Cancel", style: "cancel" },
      ],
    });
  }

  const isFiltering = query.trim().length > 0 || activeTag !== null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={textStyles.screenTitle}>Your notes</Text>
        {notes.length > 0 ? <Text style={styles.hint}>Swipe left or hold a note to delete it</Text> : null}
      </View>

      {notes.length > 0 ? (
        <View style={styles.searchBar}>
          <SearchIcon size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your notes"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
          />
        </View>
      ) : null}

      {allTags.length > 0 ? (
        <FlatList
          horizontal
          data={allTags}
          keyExtractor={(t) => t}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagRow}
          renderItem={({ item: tag }) => (
            <Pressable
              style={[styles.tagChip, activeTag === tag && styles.tagChipActive]}
              onPress={() => setActiveTag((current) => (current === tag ? null : tag))}
              accessibilityRole="button"
              accessibilityLabel={activeTag === tag ? `Clear tag filter #${tag}` : `Filter by tag #${tag}`}
            >
              <Text style={[styles.tagChipText, activeTag === tag && styles.tagChipTextActive]}>#{tag}</Text>
            </Pressable>
          )}
        />
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SwipeToDelete
            onDelete={async () => {
              await notesStore.remove(item.id);
              reload();
            }}
          >
            <NoteCard
              note={item}
              onPress={() => router.push(`/note/${item.id}`)}
              onLongPress={() => confirmDelete(item.id, item.title)}
            />
          </SwipeToDelete>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isFiltering
                ? "No notes match that search."
                : "Notes you take during a sermon will show up here, saved automatically on this device."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
    hint: { fontSize: 12, color: colors.textFaint, marginTop: 2 },
    searchBar: {
      marginHorizontal: 24,
      marginBottom: 12,
      height: 44,
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
    tagRow: { paddingHorizontal: 24, gap: 8, paddingBottom: 14 },
    tagChip: {
      height: 32,
      paddingHorizontal: 13,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    tagChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
    tagChipText: { fontFamily: fontFamily.sansBold, fontSize: 12, color: colors.textSecondary },
    tagChipTextActive: { color: colors.white },
    list: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
    empty: { paddingVertical: 40 },
    emptyText: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 20, textAlign: "center" },
  });
}
