import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { SearchIcon } from "./icons";
import { notesStore } from "@/data/notesStore";
import { useAlert } from "@/context/AlertContext";
import { useToast } from "@/context/ToastContext";

/** The last thing to try when someone's notes aren't showing up: scan
 * everything still on this device for notes the app isn't loading, and add
 * them back. Notes are only ever kept on this device (no account, no
 * server), so this is a genuine best-effort rescue rather than a guaranteed
 * one — anything an earlier version already overwrote can only come back
 * from a backup (see Backup above). */
export function RecoverySection() {
  const [busy, setBusy] = useState(false);
  const showAlert = useAlert();
  const showToast = useToast();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function handleRecover() {
    try {
      setBusy(true);
      const { recovered } = await notesStore.recover();
      if (recovered > 0) {
        showToast(`Recovered ${recovered} note${recovered === 1 ? "" : "s"}`);
      } else {
        showAlert({
          title: "No lost notes found",
          message:
            "Everything Amani can still find on this device is already in your list. If notes are still missing, restore them from a backup file under Backup above — Amani keeps no copy on a server.",
        });
      }
    } catch (err) {
      showAlert({ title: "Couldn't finish the scan", message: String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <SearchIcon size={18} color={colors.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Recover lost notes</Text>
          <Text style={styles.rowSubtitle}>
            Not seeing notes you had before? Scan this device for any that aren&apos;t loading and add them back.
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.button, styles.buttonPrimary]}
        onPress={handleRecover}
        disabled={busy}
        accessibilityRole="button"
      >
        <Text style={styles.buttonPrimaryText}>{busy ? "Scanning…" : "Scan for lost notes"}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      width: "100%",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 16,
      marginTop: 16,
    },
    headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    rowTitle: { fontFamily: fontFamily.sansBold, fontSize: 13.5, color: colors.textPrimary },
    rowSubtitle: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      lineHeight: 17,
    },
    button: {
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
      marginTop: 16,
    },
    buttonPrimary: { backgroundColor: colors.navy, borderColor: colors.navy },
    buttonPrimaryText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.white },
  });
}
