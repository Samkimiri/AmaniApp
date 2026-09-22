import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { CloseIcon } from "./icons";

/** A small, dismissible discoverability tip — pair with useHint() so it
 * only ever shows once per device. */
export function HintBanner({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{text}</Text>
      <Pressable onPress={onDismiss} hitSlop={8} accessibilityRole="button" accessibilityLabel="Dismiss tip">
        <CloseIcon size={13} color={colors.verseText} />
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.verseBg,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    text: { flex: 1, fontFamily: fontFamily.sansMedium, fontSize: 12.5, color: colors.verseText, lineHeight: 18 },
  });
}
