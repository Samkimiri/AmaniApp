import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

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

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    shadowColor: colors.navy,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
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
