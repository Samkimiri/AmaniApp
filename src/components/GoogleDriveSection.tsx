import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { CloudIcon } from "./icons";
import { buildBackupJson, importBackup } from "@/data/backup";
import { downloadBackupFromDrive, uploadBackupToDrive } from "@/data/googleDrive";
import { useAlert } from "@/context/AlertContext";
import { useToast } from "@/context/ToastContext";

WebBrowser.maybeCompleteAuthSession();

// Set this to the Web OAuth client ID from Google Cloud Console (APIs &
// Services -> Credentials -> OAuth client ID -> Web application). Until
// it's a real ID, this section tells the user Drive backup isn't set up
// yet instead of failing confusingly.
const GOOGLE_CLIENT_ID = "REPLACE_WITH_YOUR_GOOGLE_OAUTH_CLIENT_ID";
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};
// The narrowest possible scope: a hidden, app-only folder in the user's
// own Drive. The app can never see or touch anything else in their
// Drive with this scope.
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

/**
 * Lets someone connect their own Google account and back up (or restore)
 * their notes to a private, hidden area of their own Google Drive —
 * "hidden" meaning it never shows up in their regular Drive file list,
 * and no one but this app (acting on their behalf, with their own
 * sign-in) can read it. There's no server of Amani's own involved; the
 * access token this gets lives only in memory on this device for this
 * session, never stored or sent anywhere else.
 *
 * Uses the implicit OAuth flow (an access token straight back in the
 * redirect, no server-side code exchange) deliberately, since exchanging
 * an authorization code for a token normally needs a client secret —
 * unsafe to ship inside a public, client-side app with no backend of its
 * own. The trade-off: no refresh token, so the connection needs
 * re-approving roughly every hour of use (Drive access tokens are
 * short-lived) rather than staying silently connected indefinitely.
 */
export function GoogleDriveSection() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const showAlert = useAlert();
  const showToast = useToast();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [busy, setBusy] = useState<"connect" | "backup" | "restore" | null>(null);

  const redirectUri = AuthSession.makeRedirectUri();
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: [DRIVE_SCOPE],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.accessToken) {
      setAccessToken(response.authentication.accessToken);
      showToast("Connected to Google Drive");
    } else if (response?.type === "error") {
      showAlert({
        title: "Couldn't connect to Google Drive",
        message: response.params?.error_description || "Please try again.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  async function connect() {
    if (GOOGLE_CLIENT_ID.startsWith("REPLACE_")) {
      showAlert({
        title: "Google Drive isn't set up yet",
        message: "This build doesn't have a Google sign-in configured yet — see the README for setup steps.",
      });
      return;
    }
    setBusy("connect");
    await promptAsync();
    setBusy(null);
  }

  async function backupNow() {
    if (!accessToken) return;
    try {
      setBusy("backup");
      const json = await buildBackupJson();
      await uploadBackupToDrive(accessToken, json);
      showToast("Backed up to Google Drive");
    } catch (err) {
      showAlert({ title: "Couldn't back up to Google Drive", message: String(err) });
    } finally {
      setBusy(null);
    }
  }

  async function restoreFromDrive() {
    if (!accessToken) return;
    try {
      setBusy("restore");
      const json = await downloadBackupFromDrive(accessToken);
      if (!json) {
        showAlert({
          title: "No backup found",
          message: "There's no Amani backup in this Google account's Drive yet.",
        });
        return;
      }
      const { imported, failed } = await importBackup(json);
      if (failed > 0) {
        showAlert({
          title: "Backup partially restored",
          message: `Restored ${imported} note${imported === 1 ? "" : "s"}, but ${failed} ${failed === 1 ? "was" : "were"} too damaged to read and ${failed === 1 ? "was" : "were"} skipped.`,
        });
      } else {
        showToast(`Restored ${imported} note${imported === 1 ? "" : "s"} from Google Drive`);
      }
    } catch (err) {
      showAlert({ title: "Couldn't restore from Google Drive", message: String(err) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <CloudIcon size={18} color={colors.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Google Drive backup</Text>
          <Text style={styles.rowSubtitle}>
            {accessToken
              ? "Connected for this session — back up or restore below."
              : "Sign in with Google to back up your notes to your own Drive, so you can get them back on another device."}
          </Text>
        </View>
      </View>

      {accessToken ? (
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={backupNow}
            disabled={busy !== null}
            accessibilityRole="button"
          >
            <Text style={styles.buttonPrimaryText}>{busy === "backup" ? "Backing up…" : "Back up now"}</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={restoreFromDrive}
            disabled={busy !== null}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{busy === "restore" ? "Restoring…" : "Restore"}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
          onPress={connect}
          disabled={!request || busy !== null}
          accessibilityRole="button"
        >
          <Text style={styles.buttonPrimaryText}>
            {busy === "connect" ? "Connecting…" : "Connect Google Drive"}
          </Text>
        </Pressable>
      )}
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
