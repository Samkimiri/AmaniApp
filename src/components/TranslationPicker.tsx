import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { useAlert } from "@/context/AlertContext";
import {
  AVAILABLE_TRANSLATIONS,
  setActiveTranslation,
  TranslationCode,
  useActiveTranslation,
} from "@/data/bible";

/** One place to switch Bible versions, used by both the Bible tab and the
 * reader so it looks and behaves the same everywhere. Each row shows the
 * version's full name, its code, and a one-line note on what it is. The
 * sheet stays open with a "Loading…" row while a not-yet-used translation
 * is read from disk (the first switch to one parses a few MB), and closes
 * itself once the switch has actually completed. */
export function TranslationPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const showAlert = useAlert();
  const active = useActiveTranslation();
  const [loading, setLoading] = useState<TranslationCode | null>(null);

  async function choose(code: TranslationCode) {
    if (loading) return;
    if (code === active) {
      onClose();
      return;
    }
    setLoading(code);
    try {
      await setActiveTranslation(code);
      onClose();
    } catch (err) {
      showAlert({
        title: "Couldn't switch Bible version",
        message: `That version didn't load, so you're still reading ${active}. ${String(err)}`,
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={loading ? undefined : onClose}>
      <Pressable style={styles.scrim} onPress={loading ? undefined : onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={styles.title}>Bible version</Text>
        <Text style={styles.subtitle}>All versions are bundled in the app and work offline.</Text>
        {AVAILABLE_TRANSLATIONS.map((t) => {
          const isActive = t.code === active;
          return (
            <Pressable
              key={t.code}
              style={({ pressed }) => [styles.row, isActive && styles.rowActive, pressed && { opacity: 0.7 }]}
              onPress={() => choose(t.code)}
              disabled={loading !== null}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${t.name} (${t.code}), ${t.description}`}
            >
              <View style={[styles.codeBadge, isActive && styles.codeBadgeActive]}>
                <Text style={[styles.codeText, isActive && styles.codeTextActive]}>{t.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{t.name}</Text>
                <Text style={styles.description}>{loading === t.code ? "Loading…" : t.description}</Text>
              </View>
              {isActive ? <Text style={styles.check}>&#10003;</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    scrim: { flex: 1, backgroundColor: colors.scrim },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 30,
    },
    grabber: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 14,
    },
    title: { fontFamily: fontFamily.serifBold, fontSize: 19, color: colors.textPrimary },
    subtitle: { fontFamily: fontFamily.sansRegular, fontSize: 12.5, color: colors.textMuted, marginTop: 2, marginBottom: 14 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 14,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: "transparent",
    },
    rowActive: { backgroundColor: colors.verseBg, borderColor: colors.border },
    codeBadge: {
      width: 64,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 4,
    },
    codeBadgeActive: { backgroundColor: colors.navy, borderColor: colors.navy },
    codeText: { fontFamily: fontFamily.sansExtraBold, fontSize: 12, letterSpacing: 0.4, color: colors.textSecondary },
    codeTextActive: { color: colors.white },
    name: { fontFamily: fontFamily.sansBold, fontSize: 14.5, color: colors.textPrimary },
    description: { fontFamily: fontFamily.sansRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    check: { fontFamily: fontFamily.sansExtraBold, fontSize: 17, color: colors.gold },
  });
}
