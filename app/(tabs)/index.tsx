import React, { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { ColorPalette } from "@/theme/colors";
import { useColors, useTextStyles } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
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
  const verseOfTheDay = React.useMemo(() => getVerseOfTheDay(), [translationCode]);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const colors = useColors();
  const textStyles = useTextStyles();
  const styles = makeStyles(colors);

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
            <OpenBookIcon size={20} color={colors.navy} />
            <Text style={styles.brandText}>Amani</Text>
          </View>
          <View style={styles.avatar}>
            <UserIcon size={18} color="#7A6A45" />
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={styles.date}>{today}</Text>
          <Text style={textStyles.displayTitle}>{greeting()}</Text>
        </View>

        <InstallBanner />

        {verseOfTheDay ? (
          <View style={{ marginTop: 20 }}>
            <VerseOfTheDayCard verse={verseOfTheDay} onShare={shareDailyVerse} sharing={sharingVerse} />
          </View>
        ) : null}

        <PrimaryButton
          label="New sermon note"
          icon={<PlusIcon size={18} />}
          onPress={() => setTemplatePickerOpen(true)}
          style={{ marginTop: 20 }}
        />

        <View style={{ marginTop: 28 }}>
          <Text style={textStyles.label}>This week</Text>
          {latest ? (
            <View style={{ marginTop: 10 }}>
              <NoteCard note={latest} onPress={() => router.push(`/note/${latest.id}`)} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No notes yet — tap "New sermon note" during your next service to get started.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tileRow}>
          <Pressable
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => router.push("/bible")}
          >
            <OpenBookIcon size={20} color={colors.navy} />
            <Text style={styles.tileTitle}>Bible</Text>
            <Text style={styles.tileSubtitle}>Read offline</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => router.push("/notes")}
          >
            <NotesIcon size={20} color={colors.navy} />
            <Text style={styles.tileTitle}>All notes</Text>
            <Text style={styles.tileSubtitle}>{notes.length} saved</Text>
          </Pressable>
        </View>
      </ScrollView>

      {verseOfTheDay ? (
        <View style={[styles.offscreen, { pointerEvents: "none" }]}>
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

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingBottom: 40 },
    offscreen: { position: "absolute", top: 0, left: -9999, width: VERSE_CARD_WIDTH, height: VERSE_CARD_HEIGHT },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    brand: { flexDirection: "row", alignItems: "center", gap: 8 },
    brandText: { fontFamily: fontFamily.serifBold, fontSize: 21, color: colors.navy },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#EFE7D8",
      alignItems: "center",
      justifyContent: "center",
    },
    date: { fontFamily: fontFamily.sansMedium, fontSize: 13, color: colors.textMuted, marginBottom: 2 },
    emptyCard: {
      marginTop: 10,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
    },
    emptyText: { fontFamily: fontFamily.sansRegular, fontSize: 13.5, color: colors.textSecondary, lineHeight: 20 },
    tileRow: { flexDirection: "row", gap: 14, marginTop: 18 },
    tile: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 16,
      gap: 10,
    },
    tilePressed: { opacity: 0.7 },
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
