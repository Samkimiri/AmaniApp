import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { fontFamily, textStyles } from "@/theme/typography";
import { OpenBookIcon, PlusIcon, ChevronRightIcon, UserIcon } from "@/components/icons";
import { PrimaryButton } from "@/components/PrimaryButton";
import { NoteCard } from "@/components/NoteCard";
import { VerseOfTheDayCard } from "@/components/VerseOfTheDayCard";
import { InstallBanner } from "@/components/InstallBanner";
import { useNotes } from "@/hooks/useNotes";
import { getVerseOfTheDay } from "@/data/verseOfTheDay";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { notes } = useNotes();
  const latest = notes[0];
  const verseOfTheDay = React.useMemo(() => getVerseOfTheDay(), []);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
            <VerseOfTheDayCard verse={verseOfTheDay} />
          </View>
        ) : null}

        <PrimaryButton
          label="New sermon note"
          icon={<PlusIcon size={18} />}
          onPress={() => router.push("/note/new")}
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
            <ChevronRightIcon size={20} color={colors.navy} />
            <Text style={styles.tileTitle}>All notes</Text>
            <Text style={styles.tileSubtitle}>{notes.length} saved</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40 },
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
});
