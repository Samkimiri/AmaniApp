import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows } from "@/theme/tokens";

export function PrimaryButton({
  label,
  onPress,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}) {
  const colors = useColors();
  const shadows = useShadows();
  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
    >
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.label}>{label}</Text>
      <View style={{ flex: 1 }} />
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette, shadows: Shadows) {
  return StyleSheet.create({
  button: {
    width: "100%",
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    ...shadows.lg,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: fontFamily.sansBold,
    fontSize: 16,
    color: colors.white,
  },
  });
}
