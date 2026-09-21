import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors, useTextStyles } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * Privacy policy + terms of use, in one page. Written to describe what
 * Amani actually does — not a generic template — since the honest answer
 * to nearly every "what do you collect" question here is "nothing; it
 * stays on your device." Update the contact line before publishing this
 * for real; both app stores require a live URL to a page like this one
 * (this screen is reachable at /legal on the deployed site).
 */
export default function LegalScreen() {
  const colors = useColors();
  const textStyles = useTextStyles();
  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon size={20} />
        </Pressable>
        <Text style={textStyles.screenTitle}>Privacy &amp; terms</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated September 2026</Text>

        <Text style={styles.h1}>Privacy policy</Text>

        <Text style={styles.p}>
          Amani doesn't have accounts and doesn't have a server of its own — Amani itself never
          receives anything you write, photograph, or record. By default, everything you create —
          sermon notes, photos, and audio recordings — is stored only on the device or browser
          you're using it in. The one optional exception is Google Drive backup, described below,
          which you have to deliberately turn on.
        </Text>

        <Text style={styles.h2}>Google Drive backup (optional)</Text>
        <Text style={styles.p}>
          If you choose to connect Google Drive in Settings, your notes are backed up to a
          private, hidden area of your own Google Drive — not visible in your regular Drive files,
          and not visible to Amani's developer, or anyone else. This only happens if you sign in
          and tap "Back up now" or "Restore"; it's never automatic. Amani only ever requests
          access to that one hidden app-data area, never your other Drive files. Signing in goes
          directly through Google — Amani never sees or stores your Google password.
        </Text>

        <Text style={styles.h2}>What Amani accesses, and why</Text>
        <Bullet styles={styles} title="Camera and photo library">
          Only when you choose to attach a picture to a note. The photo is saved on your device as
          part of that note; Amani never uploads it anywhere unless you've turned on Google Drive
          backup.
        </Bullet>
        <Bullet styles={styles} title="Microphone">
          Only when you tap the record button to attach sermon audio to a note. The recording is
          saved on your device the same way. On iOS and Android, Amani also uses your device's
          built-in, on-device speech recognizer to caption the recording live as you record it —
          the same technology behind dictation, not a cloud service. Nothing is transcribed on
          web, and no audio ever leaves your device for this.
        </Bullet>
        <Bullet styles={styles} title="Notifications">
          Amani doesn't use notifications.
        </Bullet>
        <Bullet styles={styles} title="Location">
          Amani never asks for or accesses your location.
        </Bullet>

        <Text style={styles.h2}>What we don't do</Text>
        <Text style={styles.p}>
          Amani itself has no accounts and collects no name, email, or personal information — the
          only sign-in involved is Google's own, and only if you turn on Drive backup, which
          Amani never sees your password for. We don't sell your data or use it for advertising.
        </Text>

        <Text style={styles.h2}>Anonymous usage counts (web only)</Text>
        <Text style={styles.p}>
          The website version uses Vercel Web Analytics to count aggregate page views and
          visitors, so we can tell roughly how many people use Amani. It doesn't use cookies,
          doesn't track you across other sites, and never includes the content of your notes,
          verses, or recordings. The iOS and Android apps don't include this.
        </Text>

        <Text style={styles.h2}>Your data is only as safe as this device</Text>
        <Text style={styles.p}>
          Because everything lives locally, losing this device, clearing its storage, or
          uninstalling the app deletes your notes permanently — we have no copy to restore from.
          Settings → Backup lets you export everything to a file you keep yourself, and restore
          from it later.
        </Text>

        <Text style={styles.h2}>The Bible text</Text>
        <Text style={styles.p}>
          Amani bundles five public-domain translations — the King James Version (1611), the
          World English Bible, the American Standard Version (1901), the Darby Translation
          (1889/1890), and Young's Literal Translation (1898) — inside the app itself; none of
          them are ever fetched from a server. The cross-references shown alongside a verse are
          adapted from the Treasury of Scripture Knowledge via the CrossReferences.org dataset,
          used under CC BY 4.0.
        </Text>

        <Text style={styles.h1}>Terms of use</Text>
        <Text style={styles.p}>
          Amani is provided as-is, for personal note-taking and Bible reading. You're responsible
          for backing up anything you don't want to lose (see Backup, above). Don't use Amani to
          store or share content you don't have the right to store or share. We may update these
          terms as the app changes; continuing to use Amani after an update means you accept the
          current version.
        </Text>

        <Text style={styles.h2}>Contact</Text>
        <Text style={styles.p}>
          Questions about this policy or your data: [add a contact email before publishing this
          page].
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bullet({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>
        <Text style={styles.bulletTitle}>{title}. </Text>
        {children}
      </Text>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    content: { paddingHorizontal: 24, paddingBottom: 60 },
    updated: { fontFamily: fontFamily.sansMedium, fontSize: 12, color: colors.textFaint, marginBottom: 18 },
    h1: {
      fontFamily: fontFamily.serifBold,
      fontSize: 20,
      color: colors.textPrimary,
      marginTop: 22,
      marginBottom: 8,
    },
    h2: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11.5,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: colors.gold,
      marginTop: 20,
      marginBottom: 8,
    },
    p: { fontFamily: fontFamily.sansRegular, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
    bulletRow: { flexDirection: "row", gap: 10, marginBottom: 10, paddingRight: 4 },
    bulletDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold, marginTop: 8 },
    bulletText: {
      flex: 1,
      fontFamily: fontFamily.sansRegular,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
    },
    bulletTitle: { fontFamily: fontFamily.sansBold, color: colors.textPrimary },
  });
}
