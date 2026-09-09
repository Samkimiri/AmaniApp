import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { PauseIcon, PlayIcon, WaveformIcon } from "./icons";
import { formatDuration } from "@/types/note";

/** A recorded sermon-audio clip attached to a note, with play/pause. */
export function AudioBlockRow({
  durationMillis,
  isPlaying,
  onToggle,
}: {
  durationMillis: number;
  isPlaying: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.playButton} onPress={onToggle} hitSlop={10}>
        {isPlaying ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
      </Pressable>
      <WaveformIcon size={20} color={colors.textMuted} />
      <Text style={styles.duration}>{formatDuration(durationMillis)}</Text>
      <Text style={styles.label}>Sermon audio</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
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
