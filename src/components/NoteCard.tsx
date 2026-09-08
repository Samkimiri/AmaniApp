import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { OpenBookIcon } from "./icons";
import { firstVerseBlock, SermonNote } from "@/types/note";

export function NoteCard({ note, onPress }: { note: SermonNote; onPress: () => void }) {
  const verse = firstVerseBlock(note);
  const previewBlock = note.blocks.find(
    (b): b is Extract<typeof b, { type: "text" }> => b.type === "text" && b.text.trim().length > 0
  );
  const preview = previewBlock?.text;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.meta}>
        {[note.church, note.preacher].filter(Boolean).join(" · ") || "Personal note"}
      </Text>
      <Text style={styles.title} numberOfLines={1}>
        {note.title || "Untitled note"}
      </Text>
      {preview ? (
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      ) : null}
      {verse ? (
        <View style={styles.versePill}>
          <OpenBookIcon size={13} color={colors.verseText} />
          <Text style={styles.versePillText}>{verse.reference}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  meta: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 12,
    color: colors.textMuted,
  },
  title: {
    fontFamily: fontFamily.serifSemibold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  preview: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  versePill: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.verseBg,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 2,
  },
  versePillText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12,
    color: colors.verseText,
  },
});
