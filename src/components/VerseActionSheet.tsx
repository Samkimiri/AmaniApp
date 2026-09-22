import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useAlert } from "@/context/AlertContext";
import { fontFamily } from "@/theme/typography";
import { BookmarkIcon, ClipboardIcon, HighlightIcon, ImageCardIcon, PlusIcon } from "@/components/icons";
import { ColorSwatchRow } from "@/components/ColorSwatchRow";
import { VerseImageCard, VERSE_CARD_HEIGHT, VERSE_CARD_WIDTH } from "@/components/VerseImageCard";
import { TRANSLATION, VerseResult } from "@/data/bible";
import { bookmarks, highlights } from "@/data/verseMarks";
import { notesStore } from "@/data/notesStore";
import { shareVerseImageUri } from "@/lib/shareVerseImage";
import { newId, SermonNote } from "@/types/note";

interface Props {
  verse: VerseResult | null;
  onClose: () => void;
  /** Called after a bookmark/highlight changed, so the reader can redraw. */
  onChanged: () => void;
}

/** What you can do with a verse tapped in the reader: highlight it in a
 * colour, bookmark it, copy it, share it as a verse card, or start a note
 * from it. Everything works offline and saves on this device only. */
export function VerseActionSheet({ verse, onClose, onChanged }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const showToast = useToast();
  const showAlert = useAlert();
  const shotRef = useRef<ViewShot>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [highlightColor, setHighlightColor] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const reference = verse?.reference;
  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    Promise.all([bookmarks.isMarked(reference), highlights.get(reference)]).then(([b, h]) => {
      if (cancelled) return;
      setBookmarked(b);
      setHighlightColor(h?.color ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (!verse) return null;
  const isHighlighted = highlightColor !== undefined;

  async function toggleBookmark() {
    if (!verse) return;
    const now = await bookmarks.toggle(verse);
    setBookmarked(now);
    showToast(now ? "Bookmarked" : "Bookmark removed");
    onChanged();
  }

  async function chooseColor(colorId: string) {
    if (!verse) return;
    if (isHighlighted) await highlights.setColor(verse.reference, colorId);
    else await highlights.toggle(verse, colorId);
    setHighlightColor(colorId);
    onChanged();
  }

  async function removeHighlight() {
    if (!verse) return;
    await highlights.remove(verse.reference);
    setHighlightColor(undefined);
    onChanged();
  }

  async function copyVerse() {
    if (!verse) return;
    await Clipboard.setStringAsync(`“${verse.text}” — ${verse.reference} (${TRANSLATION.code})`);
    showToast("Verse copied");
    onClose();
  }

  async function shareCard() {
    if (busy) return;
    try {
      setBusy(true);
      // @ts-ignore - capture() exists on the ViewShot ref at runtime
      const uri: string = await shotRef.current?.capture?.();
      if (!uri) return;
      await shareVerseImageUri(uri, "amani-verse-card.png");
    } catch (err) {
      showAlert({ title: "Couldn't create the image", message: String(err) });
    } finally {
      setBusy(false);
    }
  }

  async function addToNote() {
    if (!verse) return;
    const now = new Date().toISOString();
    const id = newId();
    const note: SermonNote = {
      id,
      title: "",
      church: "",
      date: new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      blocks: [
        { id: newId(), type: "verse", reference: verse.reference, text: verse.text },
        { id: newId(), type: "text", text: "" },
      ],
      createdAt: now,
      updatedAt: now,
    };
    await notesStore.save(note);
    onClose();
    router.push(`/note/${id}`);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close verse actions" />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={styles.reference}>
          {verse.reference} · {TRANSLATION.code}
        </Text>
        <Text style={styles.preview} numberOfLines={3}>
          {verse.text}
        </Text>

        <Text style={styles.sectionLabel}>Highlight</Text>
        <View style={styles.highlightRow}>
          <ColorSwatchRow selected={highlightColor} onSelect={chooseColor} />
          {isHighlighted ? (
            <Pressable
              onPress={removeHighlight}
              hitSlop={8}
              style={styles.removeChip}
              accessibilityRole="button"
              accessibilityLabel="Remove highlight"
            >
              <Text style={styles.removeChipText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Action
            styles={styles}
            label={bookmarked ? "Bookmarked" : "Bookmark"}
            active={bookmarked}
            onPress={toggleBookmark}
            icon={<BookmarkIcon size={20} color={bookmarked ? colors.gold : colors.navy} />}
          />
          <Action
            styles={styles}
            label="Copy"
            onPress={copyVerse}
            icon={<ClipboardIcon size={20} color={colors.navy} />}
          />
          <Action
            styles={styles}
            label={busy ? "Preparing…" : "Verse card"}
            onPress={shareCard}
            icon={<ImageCardIcon size={20} color={colors.navy} />}
          />
          <Action
            styles={styles}
            label="Add to note"
            onPress={addToNote}
            icon={<PlusIcon size={20} color={colors.navy} strokeWidth={2} />}
          />
        </View>
      </View>

      {/* Offscreen render target for the shareable verse-card image. */}
      <View style={[styles.offscreen, { pointerEvents: "none" }]}>
        <VerseImageCard
          ref={shotRef}
          verseText={verse.text}
          reference={`${verse.reference} (${TRANSLATION.code})`}
          footerTitle="Shared from Amani"
        />
      </View>
    </Modal>
  );
}

function Action({
  styles,
  label,
  icon,
  onPress,
  active,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, active && styles.actionActive, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    scrim: { flex: 1, backgroundColor: colors.scrim },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
    },
    grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 14 },
    reference: { fontFamily: fontFamily.serifBold, fontSize: 18, color: colors.textPrimary },
    preview: { fontFamily: fontFamily.serifItalic, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, marginTop: 6 },
    sectionLabel: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 18,
      marginBottom: 10,
    },
    highlightRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    removeChip: { paddingHorizontal: 10, height: 28, borderRadius: 999, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
    removeChipText: { fontFamily: fontFamily.sansBold, fontSize: 11.5, color: colors.textSecondary },
    actions: { flexDirection: "row", gap: 10, marginTop: 20 },
    action: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionActive: { backgroundColor: colors.verseBg },
    actionLabel: { fontFamily: fontFamily.sansBold, fontSize: 11.5, color: colors.textPrimary, textAlign: "center" },
    offscreen: { position: "absolute", top: 0, left: -9999, width: VERSE_CARD_WIDTH, height: VERSE_CARD_HEIGHT },
  });
}
