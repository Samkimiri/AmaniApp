import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows, spacing } from "@/theme/tokens";
import { OpenBookIcon, PinIcon, WaveformIcon } from "./icons";
import { PressableScale } from "./Motion";
import { firstAudioBlock, firstVerseBlock, formatDuration, SermonNote } from "@/types/note";

export const NoteCard = React.memo(function NoteCard({
  note,
  onPress,
  onLongPress,
}: {
  note: SermonNote;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const colors = useColors();
  const shadows = useShadows();
  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);
  const verse = firstVerseBlock(note);
  const audio = firstAudioBlock(note);
  const previewBlock = (note.blocks ?? []).find(
    (b): b is Extract<typeof b, { type: "text" | "quote" }> =>
      !!b && (b.type === "text" || b.type === "quote") && (b.text?.trim()?.length ?? 0) > 0
  );
  const preview = previewBlock?.text;

  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={[styles.card, note.pinned && styles.cardPinned]}
      accessibilityRole="button"
    >
      <View style={styles.metaRow}>
        <Text style={styles.meta} numberOfLines={1}>
          {[note.church, note.series, note.preacher].filter(Boolean).join(" · ") || "Personal note"}
        </Text>
        {note.pinned ? (
          <View style={styles.pinBadge}>
            <PinIcon size={11} color={colors.gold} filled />
            <Text style={styles.pinBadgeText}>Pinned</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {note.title || "Untitled note"}
      </Text>
      {preview ? <Text style={styles.preview}>{preview}</Text> : null}
      {verse || audio || (note.tags && note.tags.length > 0) ? (
        <View style={styles.pillRow}>
          {verse ? (
            <View style={styles.versePill}>
              <OpenBookIcon size={13} color={colors.verseText} />
              <Text style={styles.versePillText}>{verse.reference}</Text>
            </View>
          ) : null}
          {audio ? (
            <View style={styles.audioPill}>
              <WaveformIcon size={13} color={colors.textSecondary} />
              <Text style={styles.audioPillText}>{formatDuration(audio.durationMillis)}</Text>
            </View>
          ) : null}
          {(note.tags ?? []).map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagPillText}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </PressableScale>
  );
});

function makeStyles(colors: ColorPalette, shadows: Shadows) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
      ...shadows.sm,
    },
    cardPinned: {
      borderColor: colors.goldLight,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    meta: {
      flex: 1,
      fontFamily: fontFamily.sansBold,
      fontSize: 10.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.textFaint,
    },
    pinBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.verseBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    pinBadgeText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 10,
      color: colors.verseText,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    title: {
      fontFamily: fontFamily.serifSemibold,
      fontSize: 19,
      lineHeight: 25,
      color: colors.textPrimary,
    },
    preview: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 13.5,
      lineHeight: 19,
      color: colors.textSecondary,
    },
    pillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    versePill: {
      flexDirection: "row",
      alignSelf: "flex-start",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.verseBg,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    versePillText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 12,
      color: colors.verseText,
    },
    audioPill: {
      flexDirection: "row",
      alignSelf: "flex-start",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    audioPillText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 12,
      color: colors.textSecondary,
    },
    tagPill: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
    },
    tagPillText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 11.5,
      color: colors.textMuted,
    },
  });
}
