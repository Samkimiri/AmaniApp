import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { OpenBookIcon } from "./icons";
import { PinPad } from "./PinPad";

/** Full-screen PIN gate shown when app lock is on and the app is locked. */
export function LockScreen({ onUnlock }: { onUnlock: (pin: string) => Promise<boolean> }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const colors = useColors();
  const styles = makeStyles(colors);

  useEffect(() => {
    if (value.length < 4 || checking) return;
    setChecking(true);
    onUnlock(value).then((ok) => {
      setChecking(false);
      if (!ok) {
        setError(true);
        setValue("");
        Animated.sequence([
          Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(next: string) {
    if (error) setError(false);
    setValue(next);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <OpenBookIcon size={30} color={colors.goldLight} />
          <Text style={styles.brandText}>Amani</Text>
        </View>
        <Text style={styles.title}>Enter your PIN</Text>
        <Text style={[styles.subtitle, error && styles.subtitleError]}>
          {error ? "Incorrect PIN — try again" : "Your notes are locked for privacy"}
        </Text>

        <Animated.View
          style={{
            transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }) }],
          }}
        >
          <PinPad value={value} onChange={handleChange} error={error} dark />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    // Rendered as a sibling on top of the still-mounted app Stack (see
    // _layout.tsx) so locking/unlocking doesn't reset navigation state —
    // absolute positioning is what makes it actually cover the screen
    // instead of just taking up space in normal document flow.
    screen: { ...(StyleSheet.absoluteFillObject as ViewStyle), backgroundColor: colors.navy, zIndex: 100 },
    content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
    brand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 36 },
    brandText: { fontFamily: fontFamily.serifBold, fontSize: 24, color: colors.white },
    title: { fontFamily: fontFamily.serifSemibold, fontSize: 19, color: colors.white, marginBottom: 6 },
    subtitle: {
      fontFamily: fontFamily.sansMedium,
      fontSize: 13,
      color: "#93A4BC",
      marginBottom: 8,
      textAlign: "center",
    },
    subtitleError: { color: "#F0A8A0" },
  });
}
