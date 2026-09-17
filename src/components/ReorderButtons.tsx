import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { ChevronDownIcon, ChevronUpIcon } from "./icons";

/** A compact up/down control for reordering a note block. Chosen over a
 * true drag handle because the note editor is a plain (non-virtualized)
 * ScrollView with wildly varying block heights (a one-line heading next
 * to a photo next to a long paragraph) — a pixel-accurate finger-drag
 * would need real-time layout measurement of every block and a floating
 * overlay to track correctly, which is fragile to hand-roll without a
 * dedicated gesture/reanimated library. This delivers the same outcome
 * (rearranging a note's structure) reliably on every platform, and stays
 * usable with a screen reader, which a drag-only gesture wouldn't be. */
export function ReorderButtons({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
}) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <View style={styles.stack}>
      <Pressable
        onPress={onMoveUp}
        disabled={disableUp}
        hitSlop={6}
        style={[styles.button, disableUp && styles.buttonDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Move up"
      >
        <ChevronUpIcon size={14} color={disableUp ? colors.textFaint : colors.textSecondary} />
      </Pressable>
      <Pressable
        onPress={onMoveDown}
        disabled={disableDown}
        hitSlop={6}
        style={[styles.button, disableDown && styles.buttonDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Move down"
      >
        <ChevronDownIcon size={14} color={disableDown ? colors.textFaint : colors.textSecondary} />
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    stack: { gap: 2 },
    button: {
      width: 24,
      height: 22,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonDisabled: { opacity: 0.35 },
  });
}
