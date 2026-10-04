import React, { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows, useTextStyles } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows, spacing } from "@/theme/tokens";
import { OpenBookIcon, PlusIcon, NotesIcon, UserIcon } from "@/components/icons";
import { PrimaryButton } from "@/components/PrimaryButton";
import { NoteCard } from "@/components/NoteCard";
import { VerseOfTheDayCard } from "@/components/VerseOfTheDayCard";
import { VerseImageCard, VERSE_CARD_HEIGHT, VERSE_CARD_WIDTH } from "@/components/VerseImageCard";
import { InstallBanner } from "@/components/InstallBanner";
import { useNotes } from "@/hooks/useNotes";
import { getVerseOfTheDay } from "@/data/verseOfTheDay";
import { useActiveTranslation } from "@/data/bible";
import { shareVerseImageUri } from "@/lib/shareVerseImage";
import { useAlert } from "@/context/AlertContext";
import { NOTE_TEMPLATES } from "@/data/noteTemplates";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ContinueReadingCard } from "@/components/BibleBrowser";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { notes } = useNotes();
  const latest = notes[0];
  const translationCode = useActiveTranslation();
  const verseOfTheDay = React.useMemo(
    () => getVerseOfTheDay(),
    // getVerseOfTheDay reads the app-wide active Bible, not a React value —
    // translationCode is the re-render trigger for that, which the linter
    // can't see.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [translationCode]
  );
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const colors = useColors();
  const textStyles = useTextStyles();
  const shadows = useShadows();
  const styles = React.useMemo(() => makeStyles(colors, shadows), [colors, shadows]);

  const shotRef = useRef<ViewShot>(null);
  const [sharingVerse, setSharingVerse] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const showAlert = useAlert();
  const { visible: onboardingVisible, complete: completeOnboarding } = useOnboarding();

  function startNoteFromTemplate(templateId: string) {
    setTemplatePickerOpen(false);
    router.push(`/note/new?template=${templateId}`);
  }

  async function shareDailyVerse() {
    if (!verseOfTheDay) return;
    try {
      setSharingVerse(true);
      // @ts-ignore - capture() exists on the ViewShot ref at runtime
      const uri: string = await shotRef.current?.capture?.();
      if (!uri) return;
      await shareVerseImageUri(uri, "amani-verse-of-the-day.png");
    } catch (err) {
      showAlert({ title: "Couldn't create the image", message: String(err) });
    } finally {
      setSharingVerse(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <OpenBookIcon size={16} color={colors.navy} strokeWidth={2} />
            </View>
            <Text style={styles.brandText}>Amani</Text>
          </View>
          <View style={styles.avatar}>
            <UserIcon size={18} color={colors.avatarIcon} />
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.date}>{today}</Text>
          <Text style={styles.heroTitle}>{greeting()}</Text>
          <View style={styles.heroRule} />
        </View>

        <InstallBanner />

        {verseOfTheDay ? (
          <View style={{ marginTop: 20 }}>
            <VerseOfTheDayCard verse={verseOfTheDay} onShare={shareDailyVerse} sharing={sharingVerse} />
          </View>
        ) : null}

        <View style={{ marginTop: 14 }}>
          <ContinueReadingCard />
        </View>

        <PrimaryButton
          label="New sermon note"
          icon={<PlusIcon size={18} />}
          onPress={() => setTemplatePickerOpen(true)}
          style={{ marginTop: 20 }}
        />

        <View style={{ marginTop: spacing.xxl - 4 }}>
          <View style={styles.sectionHeader}>
            <Text style={textStyles.label}>This week</Text>
            <View style={styles.sectionRule} />
          </View>
          {latest ? (
            <View style={{ marginTop: spacing.md }}>
              <NoteCard note={latest} onPress={() => router.push(`/note/${latest.id}`)} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <NotesIcon size={19} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyTitle}>No notes yet</Text>
                <Text style={styles.emptyText}>
                  Tap &ldquo;New sermon note&rdquo; during your next service and it&apos;ll appear here.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.tileRow}>
          <Pressable
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => router.push("/bible")}
          >
            <View style={styles.tileIcon}>
              <OpenBookIcon size={20} color={colors.navy} />
            </View>
            <Text style={styles.tileTitle}>Bible</Text>
            <Text style={styles.tileSubtitle}>All 66 books, offline</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => router.push("/notes")}
          >
            <View style={styles.tileIcon}>
              <NotesIcon size={20} color={colors.navy} />
            </View>
            <Text style={styles.tileTitle}>All notes</Text>
            <Text style={styles.tileSubtitle}>{notes.length} saved</Text>
          </Pressable>
        </View>
      </ScrollView>

      {verseOfTheDay ? (
        <View
          style={[styles.offscreen, { pointerEvents: "none" }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        >
          <VerseImageCard ref={shotRef} verseText={verseOfTheDay.text} reference={verseOfTheDay.reference} footerTitle="Verse of the Day" />
        </View>
      ) : null}

      <Modal
        visible={templatePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTemplatePickerOpen(false)}
      >
        <Pressable style={styles.pickerScrim} onPress={() => setTemplatePickerOpen(false)} />
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>Start a new note</Text>
          {NOTE_TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              style={styles.pickerRow}
              onPress={() => startNoteFromTemplate(t.id)}
              accessibilityRole="button"
              accessibilityLabel={`${t.name} — ${t.description}`}
            >
              <Text style={styles.pickerRowName}>{t.name}</Text>
              <Text style={styles.pickerRowDescription}>{t.description}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>

      <OnboardingModal visible={onboardingVisible} onComplete={completeOnboarding} />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette, shadows: Shadows) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingBottom: 40 },
    offscreen: { position: "absolute", top: 0, left: -9999, width: VERSE_CARD_WIDTH, height: VERSE_CARD_HEIGHT },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    brand: { flexDirection: "row", alignItems: "center", gap: 10 },
    brandMark: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    brandText: { fontFamily: fontFamily.serifBold, fontSize: 21, color: colors.navy },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.avatarBg,
      alignItems: "center",
      justifyContent: "center",
    },
    hero: { marginTop: spacing.lg + 2 },
    date: {
      fontFamily: fontFamily.sansBold,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.textMuted,
    },
    heroTitle: {
      fontFamily: fontFamily.serifSemibold,
      fontSize: 29,
      lineHeight: 36,
      color: colors.textPrimary,
      marginTop: 2,
    },
    // A short gold rule under the greeting — the one editorial flourish that
    // gives the top of the screen a focal point.
    heroRule: {
      width: 34,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.goldLight,
      marginTop: spacing.md,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    sectionRule: { flex: 1, height: 1, backgroundColor: colors.borderLight },
    emptyCard: {
      marginTop: spacing.md,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      ...shadows.sm,
    },
    emptyIcon: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: { fontFamily: fontFamily.serifSemibold, fontSize: 15, color: colors.textPrimary },
    emptyText: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 12.5,
      color: colors.textSecondary,
      lineHeight: 18,
      marginTop: 2,
    },
    tileRow: { flexDirection: "row", gap: 14, marginTop: 18 },
    tile: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: 16,
      gap: 10,
      ...shadows.sm,
    },
    tilePressed: { opacity: 0.7 },
    tileIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    tileTitle: { fontFamily: fontFamily.sansBold, fontSize: 13.5, color: colors.textPrimary },
    tileSubtitle: { fontFamily: fontFamily.sansMedium, fontSize: 11.5, color: colors.textMuted },
    pickerScrim: { flex: 1, backgroundColor: colors.scrim },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 22,
      paddingTop: 18,
      paddingBottom: 34,
    },
    pickerTitle: { fontFamily: fontFamily.serifBold, fontSize: 17, color: colors.textPrimary, marginBottom: 10 },
    pickerRow: {
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    pickerRowName: { fontFamily: fontFamily.sansBold, fontSize: 14.5, color: colors.textPrimary },
    pickerRowDescription: { fontFamily: fontFamily.sansRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  });
}
