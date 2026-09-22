import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { ChevronLeftIcon } from "@/components/icons";
import { bookmarks, highlights } from "@/data/verseMarks";

interface Card {
  reference: string;
  text: string;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** A simple flashcard drill built from the verses someone has already
 * bookmarked or highlighted — no separate list to maintain, and it grows
 * naturally as they mark more verses while reading. Flip to reveal the
 * text, then say honestly whether it was known; "still learning" cards
 * come back around later in the same session. Nothing here is persisted
 * beyond the bookmarks/highlights that already exist. */
export default function MemorizeScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [deck, setDeck] = useState<Card[] | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [knownFirstTry, setKnownFirstTry] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    Promise.all([bookmarks.getAll(), highlights.getAll()]).then(([b, h]) => {
      const byRef = new Map<string, Card>();
      for (const m of [...b, ...h]) {
        if (!byRef.has(m.reference)) byRef.set(m.reference, { reference: m.reference, text: m.text });
      }
      const cards = shuffle(Array.from(byRef.values()));
      setDeck(cards);
      setQueue(cards);
    });
  }, []);

  const total = deck?.length ?? 0;
  const current = queue[0];

  function knewIt() {
    setKnownFirstTry((n) => n + 1);
    setReviewed((n) => n + 1);
    setFlipped(false);
    setQueue((q) => q.slice(1));
  }

  function reviewAgain() {
    setReviewed((n) => n + 1);
    setFlipped(false);
    setQueue((q) => [...q.slice(1), q[0]]);
  }

  function restart() {
    if (!deck) return;
    setQueue(shuffle(deck));
    setFlipped(false);
    setKnownFirstTry(0);
    setReviewed(0);
  }

  const remainingUnique = useMemo(() => new Set(queue.map((c) => c.reference)).size, [queue]);
  const done = deck !== null && deck.length > 0 && remainingUnique === 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeftIcon size={20} />
        </Pressable>
        <Text style={styles.headerTitle}>Memorize verses</Text>
      </View>

      <View style={styles.content}>
        {deck === null ? null : deck.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No verses to practice yet</Text>
            <Text style={styles.emptyText}>
              Bookmark or highlight a verse in the Bible or the reader, and it will show up here as a flashcard.
            </Text>
          </View>
        ) : done ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Session complete</Text>
            <Text style={styles.emptyText}>
              You reviewed {total} verse{total === 1 ? "" : "s"} — {knownFirstTry} known on the first try.
            </Text>
            <Pressable style={styles.primary} onPress={restart} accessibilityRole="button" accessibilityLabel="Start again">
              <Text style={styles.primaryText}>Start again</Text>
            </Pressable>
          </View>
        ) : current ? (
          <>
            <Text style={styles.progress}>
              Card {reviewed + 1} of {total} · {remainingUnique} left
            </Text>
            <Pressable
              style={styles.card}
              onPress={() => setFlipped((f) => !f)}
              accessibilityRole="button"
              accessibilityLabel={flipped ? `${current.reference}: ${current.text}` : `${current.reference}. Tap to reveal the verse.`}
            >
              <Text style={styles.cardReference}>{current.reference}</Text>
              {flipped ? (
                <Text style={styles.cardText}>&ldquo;{current.text}&rdquo;</Text>
              ) : (
                <Text style={styles.cardHint}>Tap to reveal</Text>
              )}
            </Pressable>

            {flipped ? (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, styles.actionSecondary]}
                  onPress={reviewAgain}
                  accessibilityRole="button"
                  accessibilityLabel="Still learning this verse"
                >
                  <Text style={styles.actionSecondaryText}>Still learning</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.actionPrimary]}
                  onPress={knewIt}
                  accessibilityRole="button"
                  accessibilityLabel="I knew this verse"
                >
                  <Text style={styles.actionPrimaryText}>Knew it</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingBottom: 8 },
    backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: fontFamily.serifBold, fontSize: 18, color: colors.textPrimary, flex: 1 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
    progress: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.textMuted, textAlign: "center", marginBottom: 16 },
    card: {
      minHeight: 260,
      backgroundColor: colors.navy,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      padding: 28,
      gap: 18,
    },
    cardReference: { fontFamily: fontFamily.serifBold, fontSize: 24, color: colors.white, textAlign: "center" },
    cardHint: { fontFamily: fontFamily.sansSemibold, fontSize: 13, color: "#93A4BC" },
    cardText: { fontFamily: fontFamily.serifRegular, fontSize: 18, lineHeight: 27, color: "#EDE7D8", textAlign: "center", fontStyle: "italic" },
    actions: { flexDirection: "row", gap: 12, marginTop: 20 },
    actionButton: { flex: 1, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    actionSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    actionSecondaryText: { fontFamily: fontFamily.sansBold, fontSize: 14, color: colors.textSecondary },
    actionPrimary: { backgroundColor: colors.navy },
    actionPrimaryText: { fontFamily: fontFamily.sansBold, fontSize: 14, color: colors.white },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 12 },
    emptyTitle: { fontFamily: fontFamily.serifBold, fontSize: 19, color: colors.textPrimary, textAlign: "center" },
    emptyText: { fontFamily: fontFamily.sansRegular, fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 21 },
    primary: { marginTop: 16, height: 48, paddingHorizontal: 26, borderRadius: 14, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
    primaryText: { fontFamily: fontFamily.sansBold, fontSize: 14.5, color: colors.white },
  });
}
