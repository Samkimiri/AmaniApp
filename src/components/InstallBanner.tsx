import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { ChevronRightIcon, DownloadIcon } from "./icons";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

/** Prompts a browser visitor to install Amani as an app. Renders nothing
 * on native, and on web unless the browser has actually offered an
 * install (see useInstallPrompt). */
export function InstallBanner() {
  const { available, promptInstall } = useInstallPrompt();
  const colors = useColors();
  const styles = makeStyles(colors);
  if (!available) return null;

  return (
    <Pressable style={({ pressed }) => [styles.banner, pressed && styles.pressed]} onPress={promptInstall}>
      <View style={styles.iconWrap}>
        <DownloadIcon size={18} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Install Amani</Text>
        <Text style={styles.subtitle}>Add it to your home screen for quick, offline access</Text>
      </View>
      <ChevronRightIcon size={18} color={colors.gold} />
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.verseBg,
      borderWidth: 1,
      borderColor: "#F0E1BC",
      borderRadius: 14,
      padding: 14,
      marginTop: 16,
    },
    pressed: { opacity: 0.85 },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontFamily: fontFamily.sansBold, fontSize: 13.5, color: colors.verseText },
    subtitle: { fontFamily: fontFamily.sansRegular, fontSize: 11.5, color: "#9A7B3D", marginTop: 1 },
  });
}
