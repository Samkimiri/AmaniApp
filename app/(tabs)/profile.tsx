import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { fontFamily, textStyles } from "@/theme/typography";
import { OpenBookIcon, UserIcon } from "@/components/icons";
import { TRANSLATION } from "@/data/bible";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={textStyles.screenTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarLarge}>
          <UserIcon size={30} color="#7A6A45" />
        </View>
        <Text style={styles.name}>Your notes, on this device</Text>
        <Text style={styles.subtitle}>
          Amani doesn't require an account. Notes stay on this phone unless you choose to share
          them.
        </Text>

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
        </View>

        <Text style={styles.footnote}>
          Amani &middot; v0.1.0 (concept build){"\n"}
          Scripture text: {TRANSLATION.name}, public domain.{"\n"}
          Typeset in Newsreader &amp; Plus Jakarta Sans (SIL Open Font License).
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  content: { paddingHorizontal: 24, alignItems: "center" },
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
  footnote: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 11.5,
    color: colors.textFaint,
    textAlign: "center",
    marginTop: 28,
    lineHeight: 17,
  },
});
