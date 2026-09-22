import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors, useTextStyles, useTheme, type ThemeMode } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { ChartIcon, ChevronRightIcon, DocumentIcon, MoonIcon, OpenBookIcon, UserIcon } from "@/components/icons";
import { AppLockSection } from "@/components/AppLockSection";
import { BackupSection } from "@/components/BackupSection";
import { GoogleDriveSection } from "@/components/GoogleDriveSection";
import {
  AVAILABLE_TRANSLATIONS,
  setActiveTranslation,
  TRANSLATION,
  TranslationCode,
  useActiveTranslation,
} from "@/data/bible";

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "light", label: "Light" },
  { mode: "reading", label: "Reading" },
  { mode: "dark", label: "Dark" },
  { mode: "system", label: "System" },
];

export default function SettingsScreen() {
  const translationCode = useActiveTranslation(); // subscribes so this screen re-renders when the Bible tab switches translations
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const colors = useColors();
  const textStyles = useTextStyles();
  const { mode, setMode } = useTheme();
  const styles = makeStyles(colors);

  async function chooseTranslation(code: TranslationCode) {
    if (code === translationCode) return;
    setSwitchingTo(code);
    await setActiveTranslation(code);
    setSwitchingTo(null);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={textStyles.screenTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarLarge}>
          <UserIcon size={30} color="#7A6A45" />
        </View>
        <Text style={styles.name}>Your notes, on this device</Text>
        <Text style={styles.subtitle}>
          Amani doesn't require an account and works fully offline — your notes and the whole
          Bible stay on this device, no connection needed.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <MoonIcon size={18} color={colors.navy} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Appearance</Text>
              <Text style={styles.rowSubtitle}>Light is the default — try Reading for a warm, paper-like feel during long stretches of reading</Text>
            </View>
          </View>
          <View style={styles.translationChipRow}>
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.mode}
                style={[styles.translationChip, mode === opt.mode && styles.translationChipActive]}
                onPress={() => setMode(opt.mode)}
                accessibilityRole="button"
                accessibilityLabel={`${opt.label} appearance`}
              >
                <Text style={[styles.translationChipText, mode === opt.mode && styles.translationChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <OpenBookIcon size={18} color={colors.navy} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Bible translation</Text>
              <Text style={styles.rowSubtitle}>
                {TRANSLATION.name} ({TRANSLATION.code}) &middot; {TRANSLATION.license}
              </Text>
            </View>
          </View>
          <View style={styles.translationChipRow}>
            {AVAILABLE_TRANSLATIONS.map((t) => (
              <Pressable
                key={t.code}
                style={[styles.translationChip, translationCode === t.code && styles.translationChipActive]}
                onPress={() => chooseTranslation(t.code)}
                disabled={switchingTo !== null}
              >
                <Text
                  style={[
                    styles.translationChipText,
                    translationCode === t.code && styles.translationChipTextActive,
                  ]}
                >
                  {switchingTo === t.code ? "Loading…" : t.code}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.linkRow} onPress={() => router.push("/stats")}>
          <ChartIcon size={16} color={colors.textSecondary} />
          <Text style={styles.linkRowText}>Your reading, so far</Text>
          <ChevronRightIcon size={16} />
        </Pressable>

        <AppLockSection />
        <BackupSection />
        <GoogleDriveSection />

        <Pressable style={styles.linkRow} onPress={() => router.push("/legal")}>
          <DocumentIcon size={16} color={colors.textSecondary} />
          <Text style={styles.linkRowText}>Privacy &amp; terms</Text>
          <ChevronRightIcon size={16} />
        </Pressable>

        <Text style={styles.footnote}>
          Amani: Sermon Notes &middot; v1.0.0{"\n"}
          Scripture text: {TRANSLATION.name}, public domain.{"\n"}
          Cross-references adapted from the Treasury of Scripture Knowledge via
          CrossReferences.org (CC BY 4.0).{"\n"}
          Typeset in Newsreader &amp; Plus Jakarta Sans (SIL Open Font License).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
    content: { paddingHorizontal: 24, paddingBottom: 40, alignItems: "center" },
    avatarLarge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#EFE7D8",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },
    name: { fontFamily: fontFamily.serifSemibold, fontSize: 18, color: colors.textPrimary, marginTop: 14 },
    subtitle: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 13.5,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 6,
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    card: {
      width: "100%",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 16,
      marginTop: 26,
    },
    row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    rowTitle: { fontFamily: fontFamily.sansBold, fontSize: 13.5, color: colors.textPrimary },
    rowSubtitle: { fontFamily: fontFamily.sansRegular, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
    translationChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
    translationChip: {
      height: 34,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    translationChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
    translationChipText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.textSecondary },
    translationChipTextActive: { color: colors.white },
    linkRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
    },
    linkRowText: { flex: 1, fontFamily: fontFamily.sansBold, fontSize: 13.5, color: colors.textPrimary },
    footnote: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 11.5,
      color: colors.textFaint,
      textAlign: "center",
      marginTop: 28,
      lineHeight: 17,
    },
  });
}
