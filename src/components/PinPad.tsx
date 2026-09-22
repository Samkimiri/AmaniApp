import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { BackspaceIcon } from "./icons";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"];

/** A themed numeric keypad for entering a PIN, with dot progress above it. */
export function PinPad({
  value,
  onChange,
  length = 4,
  error,
  dark,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  dark?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  function press(key: string) {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
    } else if (key && value.length < length) {
      onChange(value + key);
    }
  }

  return (
    <View>
      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              dark && styles.dotDark,
              i < value.length && (error ? styles.dotError : dark ? styles.dotFilledDark : styles.dotFilled),
            ]}
          />
        ))}
      </View>

      <View style={styles.grid}>
        {KEYS.map((key, i) => {
          if (key === "") return <View key={i} style={styles.key} />;
          if (key === "backspace") {
            return (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                onPress={() => press(key)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Delete digit"
              >
                <BackspaceIcon size={22} color={dark ? colors.white : colors.textPrimary} />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              onPress={() => press(key)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${key}`}
            >
              <Text style={[styles.keyText, dark && styles.keyTextDark]}>{key}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const DOT_SIZE = 14;

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    dots: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 36 },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    dotDark: { borderColor: "rgba(255,255,255,0.35)" },
    dotFilled: { backgroundColor: colors.navy, borderColor: colors.navy },
    dotFilledDark: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
    dotError: { backgroundColor: colors.danger, borderColor: colors.danger },

    grid: { flexDirection: "row", flexWrap: "wrap", width: 264, alignSelf: "center" },
    key: {
      width: 88,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
    },
    keyPressed: { opacity: 0.5 },
    keyText: { fontFamily: fontFamily.serifSemibold, fontSize: 26, color: colors.textPrimary },
    keyTextDark: { color: colors.white },
  });
}
