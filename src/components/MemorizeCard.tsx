import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { bookmarks, highlights } from "@/data/verseMarks";
import { CardsIcon, ChevronRightIcon } from "./icons";

/** Entry point into the flashcard drill, built from whatever's already
 * bookmarked or highlighted — hidden until there's at least one verse to
 * practice, so it never shows an empty promise. */
export function MemorizeCard() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([bookmarks.getAll(), highlights.getAll()]).then(([b, h]) => {
      if (cancelled) return;
      setCount(new Set([...b, ...h].map((m) => m.reference)).size);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!count) return null;

  return (
    <Pressable
      onPress={() => router.push("/memorize")}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`Memorize verses: ${count} saved`}
    >
      <View style={styles.icon}>
        <CardsIcon size={20} color={colors.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Memorize</Text>
        <Text style={styles.title}>
          {count} saved verse{count === 1 ? "" : "s"} to practice
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
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginTop: 12,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 10.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.gold,
    },
    title: { fontFamily: fontFamily.serifBold, fontSize: 16.5, color: colors.textPrimary, marginTop: 2 },
  });
}
