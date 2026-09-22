import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { DocumentIcon } from "./icons";
import { exportBackup, importBackup, pickBackupJson } from "@/data/backup";
import { notesStore } from "@/data/notesStore";
import { useAlert } from "@/context/AlertContext";
import { useToast } from "@/context/ToastContext";

/** Lets someone download every note (and its photos/recordings) as one
 * file, and restore from that file later — the only way to recover
 * anything if this device is lost or its storage is cleared, since
 * Amani keeps no account and no server copy of your notes. */
export function BackupSection() {
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const showAlert = useAlert();
  const showToast = useToast();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function handleExport() {
    try {
      setBusy("export");
      // Read fresh rather than trusting a possibly-stale React state
      // snapshot — this section isn't the notes list, so there's no
      // guarantee its own data has already loaded by the time someone
      // taps this right after opening the screen.
      const currentNotes = await notesStore.getAll();
      if (currentNotes.length === 0) {
        showAlert({ title: "Nothing to back up yet", message: "Write a note first, then come back here." });
        return;
      }
      await exportBackup();
    } catch (err) {
      showAlert({ title: "Couldn't create the backup", message: String(err) });
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    try {
      setBusy("import");
      const json = await pickBackupJson();
      if (!json) return; // user canceled
      const { imported, failed } = await importBackup(json);
      if (failed > 0) {
        // A warning worth actually reading and dismissing on purpose,
        // not a quick toast — some notes didn't make it.
        showAlert({
          title: "Backup partially restored",
          message: `Restored ${imported} note${imported === 1 ? "" : "s"}, but ${failed} ${failed === 1 ? "was" : "were"} too damaged to read and ${failed === 1 ? "was" : "were"} skipped.`,
        });
      } else {
        showToast(`Restored ${imported} note${imported === 1 ? "" : "s"} onto this device`);
      }
    } catch (err) {
      showAlert({ title: "Couldn't restore that backup", message: String(err) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <DocumentIcon size={18} color={colors.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Backup</Text>
          <Text style={styles.rowSubtitle}>
            Notes live only on this device. Back them up before switching phones or clearing storage.
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleExport} disabled={busy !== null}>
          <Text style={styles.buttonPrimaryText}>{busy === "export" ? "Preparing…" : "Export all notes"}</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleImport} disabled={busy !== null}>
          <Text style={styles.buttonText}>{busy === "import" ? "Restoring…" : "Restore from file"}</Text>
        </Pressable>
      </View>
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
    actionsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
    button: {
      flex: 1,
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    buttonText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.textSecondary },
    buttonPrimary: { backgroundColor: colors.navy, borderColor: colors.navy },
    buttonPrimaryText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.white },
  });
}
