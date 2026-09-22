import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { PauseIcon, PlayIcon, WaveformIcon } from "./icons";
import { formatDuration } from "@/types/note";

/** A recorded sermon-audio clip attached to a note, with play/pause and
 * (when available) its live-captioned transcript underneath. */
export function AudioBlockRow({
  durationMillis,
  isPlaying,
  onToggle,
  transcript,
}: {
  durationMillis: number;
  isPlaying: boolean;
  onToggle: () => void;
  transcript?: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          style={styles.playButton}
          onPress={onToggle}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause recording" : "Play recording"}
        >
          {isPlaying ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
        </Pressable>
        <WaveformIcon size={20} color={colors.textMuted} />
        <Text style={styles.duration}>{formatDuration(durationMillis)}</Text>
        <Text style={styles.label}>Sermon audio</Text>
      </View>
      {transcript ? <Text style={styles.transcript}>{transcript}</Text> : null}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 8,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    transcript: {
      fontFamily: fontFamily.sansRegular,
      fontStyle: "italic",
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    playButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    duration: { fontFamily: fontFamily.sansBold, fontSize: 13, color: colors.textPrimary },
    label: { fontFamily: fontFamily.sansMedium, fontSize: 12, color: colors.textMuted, marginLeft: "auto" },
  });
}
