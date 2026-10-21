import React, { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows, useTextStyles } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows, spacing } from "@/theme/tokens";
import { OpenBookIcon, PlusIcon, NotesIcon, UserIcon, CompassIcon, ChevronRightIcon, ChecklistIcon } from "@/components/icons";
import { PrimaryButton } from "@/components/PrimaryButton";
import { NoteCard } from "@/components/NoteCard";
import { VerseOfTheDayCard } from "@/components/VerseOfTheDayCard";
import { VerseImageCard, VERSE_CARD_HEIGHT, VERSE_CARD_WIDTH } from "@/components/VerseImageCard";
import { InstallBanner } from "@/components/InstallBanner";
import { useNotes } from "@/hooks/useNotes";
import { notesStore } from "@/data/notesStore";
import { devotionalOfTheDay } from "@/data/devotionals";
import { getVerseOfTheDay } from "@/data/verseOfTheDay";
import { useActiveTranslation } from "@/data/bible";
import { shareVerseImageUri } from "@/lib/shareVerseImage";
import { useAlert } from "@/context/AlertContext";
import { NOTE_TEMPLATES } from "@/data/noteTemplates";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingModal } from "@/components/OnboardingModal";
import { FadeInView, PressableScale } from "@/components/Motion";
import { ContinueReadingCard } from "@/components/BibleBrowser";
import { AmaniVideoModal, DiscoverAmaniCard, useDiscoverVideo } from "@/components/AmaniVideoModal";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { notes, reload } = useNotes();
  const pinned = notes.filter((n) => n.pinned).slice(0, 3);
  const latest = notes.find((n) => !n.pinned);
  const todaysDevotional = React.useMemo(() => devotionalOfTheDay(), []);

  // Unfinished action steps from the most recent notes, so a response
  // written down on Sunday stays in view during the week.
  const actionSteps = React.useMemo(() => {
    const items: { noteId: string; noteTitle: string; blockId: string; itemId: string; text: string }[] = [];
    for (const n of notes.slice(0, 8)) {
      for (const b of n.blocks ?? []) {
        if (!b || b.type !== "checklist") continue;
        for (const i of b.items ?? []) {
          if (!i.done && i.text?.trim()) {
            items.push({ noteId: n.id, noteTitle: n.title || "Untitled note", blockId: b.id, itemId: i.id, text: i.text.trim() });
          }
        }
      }
    }
    return items.slice(0, 5);
  }, [notes]);

  async function completeActionStep(noteId: string, blockId: string, itemId: string) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    await notesStore.save({
      ...note,
      blocks: note.blocks.map((b) =>
        b.id === blockId && b.type === "checklist"
          ? { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, done: true } : i)) }
          : b
      ),
      updatedAt: new Date().toISOString(),
    });
    reload();
  }
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
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const { visible: discoverVideoVisible, dismiss: dismissDiscoverVideo } = useDiscoverVideo();
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
          <Pressable
            onPress={() => router.push("/settings")}
            style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <UserIcon size={18} color={colors.avatarIcon} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.date}>{today}</Text>
          <Text style={styles.heroTitle}>{greeting()}</Text>
          <View style={styles.heroRule} />
        </View>

        <InstallBanner />

        {verseOfTheDay ? (
          <View style={{ marginTop: 20 }}>
            <VerseOfTheDayCard
              verse={verseOfTheDay}
              onPress={() =>
                router.push(
                  `/bible-read?book=${encodeURIComponent(verseOfTheDay.book)}&chapter=${verseOfTheDay.chapter}&verse=${verseOfTheDay.verse}`
                )
              }
              onShare={shareDailyVerse}
              sharing={sharingVerse}
            />
          </View>
        ) : null}

        {discoverVideoVisible ? (
          <FadeInView style={{ marginTop: 14 }}>
            <DiscoverAmaniCard
              onWatch={() => setVideoModalOpen(true)}
              onDismiss={dismissDiscoverVideo}
            />
          </FadeInView>
        ) : null}

        <View style={{ marginTop: 14 }}>
          <ContinueReadingCard />
        </View>

        <PressableScale
          style={[styles.devotionalCard, { marginTop: 14 }]}
          onPress={() => router.push(`/devotional/${todaysDevotional.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Today's devotional: ${todaysDevotional.title}`}
        >
          <View style={styles.tileIcon}>
            <CompassIcon size={20} color={colors.navy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.devotionalLabel}>Today&apos;s devotional</Text>
            <Text style={styles.devotionalTitle}>{todaysDevotional.title}</Text>
            <Text style={styles.devotionalSummary} numberOfLines={1}>
              {todaysDevotional.summary}
            </Text>
          </View>
          <ChevronRightIcon size={16} color={colors.textFaint} />
        </PressableScale>

        <PrimaryButton
          label="New sermon note"
          icon={<PlusIcon size={18} />}
          onPress={() => setTemplatePickerOpen(true)}
          style={{ marginTop: 20 }}
        />

        {actionSteps.length > 0 ? (
          <View style={{ marginTop: spacing.xxl - 4 }}>
            <View style={styles.sectionHeader}>
              <Text style={textStyles.label}>This week&apos;s action steps</Text>
              <View style={styles.sectionRule} />
            </View>
            <View style={styles.actionCard}>
              {actionSteps.map((step) => (
                <View key={`${step.noteId}-${step.itemId}`} style={styles.actionRow}>
                  <Pressable
                    onPress={() => completeActionStep(step.noteId, step.blockId, step.itemId)}
                    hitSlop={6}
                    style={styles.actionCheckbox}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: false }}
                    accessibilityLabel={`Mark done: ${step.text}`}
                  />
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/note/${step.noteId}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open note ${step.noteTitle}`}
                  >
                    <Text style={styles.actionText}>{step.text}</Text>
                    <Text style={styles.actionMeta} numberOfLines={1}>
                      {step.noteTitle}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {pinned.length > 0 ? (
          <View style={{ marginTop: spacing.xxl - 4 }}>
            <View style={styles.sectionHeader}>
              <Text style={textStyles.label}>Pinned</Text>
              <View style={styles.sectionRule} />
            </View>
            <View style={{ gap: 12, marginTop: spacing.md }}>
              {pinned.map((n) => (
                <NoteCard key={n.id} note={n} onPress={() => router.push(`/note/${n.id}`)} />
              ))}
            </View>
          </View>
        ) : null}
        {latest || notes.length === 0 ? (
        <View style={{ marginTop: spacing.xxl - 4 }}>
          <View style={styles.sectionHeader}>
            <Text style={textStyles.label}>This week</Text>
            <View style={styles.sectionRule} />
          </View>
          {latest ? (
            <FadeInView style={{ marginTop: spacing.md }}>
              <NoteCard note={latest} onPress={() => router.push(`/note/${latest.id}`)} />
            </FadeInView>
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
        ) : null}

        <View style={styles.tileRow}>
          <PressableScale
            style={styles.tile}
            onPress={() => router.push("/bible")}
            accessibilityRole="button"
          >
            <View style={styles.tileIcon}>
              <OpenBookIcon size={20} color={colors.navy} />
            </View>
            <Text style={styles.tileTitle}>Bible</Text>
            <Text style={styles.tileSubtitle}>All 66 books, offline</Text>
          </PressableScale>
          <PressableScale
            style={styles.tile}
            onPress={() => router.push("/notes")}
            accessibilityRole="button"
          >
            <View style={styles.tileIcon}>
              <NotesIcon size={20} color={colors.navy} />
            </View>
            <Text style={styles.tileTitle}>All notes</Text>
            <Text style={styles.tileSubtitle}>{notes.length} saved</Text>
          </PressableScale>
        </View>
        <View style={styles.tileRow}>
          <PressableScale
            style={styles.tile}
            onPress={() => router.push("/devotionals")}
            accessibilityRole="button"
          >
            <View style={styles.tileIcon}>
              <CompassIcon size={20} color={colors.navy} />
            </View>
            <Text style={styles.tileTitle}>Devotionals</Text>
            <Text style={styles.tileSubtitle}>Topical studies &amp; prayer</Text>
          </PressableScale>
          <PressableScale
            style={styles.tile}
            onPress={() => router.push("/soap")}
            accessibilityRole="button"
          >
            <View style={styles.tileIcon}>
              <ChecklistIcon size={20} color={colors.navy} />
            </View>
            <Text style={styles.tileTitle}>SOAP journal</Text>
            <Text style={styles.tileSubtitle}>Daily quiet time</Text>
          </PressableScale>
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
          <View style={styles.grabber} />
          <Text style={styles.pickerTitle}>Start a new note</Text>
          {NOTE_TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
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
      <AmaniVideoModal visible={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette, shadows: Shadows) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingBottom: 40, maxWidth: 680, width: "100%", alignSelf: "center" },
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
    devotionalCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: 16,
      ...shadows.sm,
    },
    devotionalLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 10,
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: colors.gold,
    },
    devotionalTitle: { fontFamily: fontFamily.serifSemibold, fontSize: 16, color: colors.textPrimary, marginTop: 1 },
    devotionalSummary: { fontFamily: fontFamily.sansRegular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
    actionCard: {
      marginTop: spacing.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingHorizontal: 16,
      paddingVertical: 6,
      ...shadows.sm,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    actionCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      marginTop: 1,
    },
    actionText: { fontFamily: fontFamily.sansMedium, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
    actionMeta: { fontFamily: fontFamily.sansRegular, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
    pickerScrim: { flex: 1, backgroundColor: colors.scrim },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 34,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },
    grabber: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.grabber,
      alignSelf: "center",
      marginBottom: 14,
    },
    pickerTitle: { fontFamily: fontFamily.serifBold, fontSize: 17, color: colors.textPrimary, marginBottom: 10 },
    pickerRow: {
      paddingVertical: 13,
      paddingHorizontal: 8,
      marginHorizontal: -8,
      borderRadius: radius.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    pickerRowPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    pickerRowName: { fontFamily: fontFamily.sansBold, fontSize: 14.5, color: colors.textPrimary },
    pickerRowDescription: { fontFamily: fontFamily.sansRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  });
}
