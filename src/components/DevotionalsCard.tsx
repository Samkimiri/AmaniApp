import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius } from "@/theme/tokens";
import { ChevronRightIcon, CompassIcon } from "./icons";
import { devotionalOfTheDay } from "@/data/devotionals";

/** Clean shortcut card to topical devotionals on the Bible screen. */
export function DevotionalsCard() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const today = useMemo(() => devotionalOfTheDay(), []);

  return (
    <Pressable
      onPress={() => router.push("/devotionals")}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`Topical devotionals: Today's topic is ${today.title}`}
    >
      <View style={styles.icon}>
        <CompassIcon size={20} color={colors.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Topical Devotionals</Text>
        <Text style={styles.title} numberOfLines={1}>
          {today.title} &middot; {today.summary}
        </Text>
      </View>
      <ChevronRightIcon size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 16,
      marginTop: 12,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontFamily: fontFamily.sansBold,
      fontSize: 10.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.gold,
    },
    title: {
      fontFamily: fontFamily.serifSemibold,
      fontSize: 15,
      color: colors.textPrimary,
      marginTop: 2,
    },
  });
}

