import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { HIGHLIGHT_COLORS } from "@/theme/highlightColors";

/** A row of tappable color swatches for picking a highlight / scripture
 * background color — shared by the Bible tab and the note editor. */
export function ColorSwatchRow({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (colorId: string) => void;
}) {
  return (
    <View style={styles.row}>
      {HIGHLIGHT_COLORS.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => onSelect(c.id)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${c.name} color`}
          style={[
            styles.swatch,
            { backgroundColor: c.background, borderColor: c.accent },
            selected === c.id && styles.swatchSelected,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2 },
  swatchSelected: { borderWidth: 3 },
});
