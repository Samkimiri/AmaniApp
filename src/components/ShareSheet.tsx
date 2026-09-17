import React, { useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as Clipboard from "expo-clipboard";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import {
  ChevronDownIcon,
  ClipboardIcon,
  CloseIcon,
  DocumentIcon,
  ImageCardIcon,
  LinkIcon,
  SearchIcon,
  TrashIcon,
} from "./icons";
import { VerseImageCard, VERSE_CARD_HEIGHT, VERSE_CARD_WIDTH } from "./VerseImageCard";
import { shareVerseImageUri } from "@/lib/shareVerseImage";
import { noteToHtml, noteToPlainText, SermonNote, VerseBlock } from "@/types/note";
import { useAlert } from "@/context/AlertContext";

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  note: SermonNote;
  onDelete: () => void;
}

interface VerseOption {
  block: VerseBlock;
  /** The nearest preceding subheading's text, if any — shown so it's
   * easy to tell apart two verses under different points in a long note. */
  context?: string;
}

/** Every verse block in the note, each paired with whichever subheading
 * ("point") most recently preceded it — used to let the verse-card picker
 * search across both, e.g. typing a point's title to find the verse
 * under it. */
function verseOptionsFor(note: SermonNote): VerseOption[] {
  const options: VerseOption[] = [];
  let currentContext: string | undefined;
  for (const block of note.blocks) {
    if (block.type === "heading") {
      currentContext = block.text.trim() || undefined;
    } else if (block.type === "verse") {
      options.push({ block, context: currentContext });
    }
  }
  return options;
}

/** Opens the note's formatted HTML in a new tab and prints it — web
 * only. Lets the user pick "Save as PDF" in the browser's print dialog,
 * which is the standard way to get a real PDF out of a web page without
 * a native module or a client-side PDF library. */
function printNoteInNewTab(note: SermonNote) {
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Pop-up blocked — allow pop-ups for this site to save the note as a PDF.");
  }
  win.document.write(noteToHtml(note));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

/**
 * The "share this note" bottom sheet — lets the user pick a format.
 * Three of the four formats are fully wired up to real device APIs; the
 * fourth ("Amani link") is an honest stub, since opening a note inside
 * another person's copy of the app needs a small sync backend this
 * concept build doesn't include yet (see the README).
 */
export function ShareSheet({ visible, onClose, note, onDelete }: ShareSheetProps) {
  const shotRef = useRef<ViewShot>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const showAlert = useAlert();
  const colors = useColors();
  const styles = makeStyles(colors);

  const verseOptions = useMemo(() => verseOptionsFor(note), [note]);
  const [selectedVerseId, setSelectedVerseId] = useState<string | undefined>(verseOptions[0]?.block.id);
  const selectedOption =
    verseOptions.find((o) => o.block.id === selectedVerseId) ?? verseOptions[0];
  const verse = selectedOption?.block;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [verseSearch, setVerseSearch] = useState("");
  const filteredOptions = useMemo(() => {
    const q = verseSearch.trim().toLowerCase();
    if (!q) return verseOptions;
    return verseOptions.filter((o) =>
      [o.block.reference, o.block.text, o.context].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [verseOptions, verseSearch]);

  async function shareVerseImage() {
    if (!verse) {
      showAlert({
        title: "No verse in this note yet",
        message: "Insert a verse into the note first to make a verse card.",
      });
      return;
    }
    try {
      setBusy("image");
      // @ts-ignore - capture() exists on the ViewShot ref at runtime
      const uri: string = await shotRef.current?.capture?.();
      if (!uri) return;
      await shareVerseImageUri(uri, "amani-verse-card.png");
    } catch (err) {
      showAlert({ title: "Couldn't create the image", message: String(err) });
    } finally {
      setBusy(null);
    }
  }

  async function sharePdf() {
    try {
      setBusy("pdf");
      if (Platform.OS === "web") {
        // expo-print's web implementation ignores the html argument
        // entirely and just calls window.print() on the current page —
        // it can't produce a file at all on web. Open the formatted note
        // in a new tab and print *that*, so "Save as PDF" in the
        // browser's print dialog actually saves the note's content.
        printNoteInNewTab(note);
      } else {
        const { uri } = await Print.printToFileAsync({ html: noteToHtml(note) });
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      }
    } catch (err) {
      showAlert({ title: "Couldn't create the PDF", message: String(err) });
    } finally {
      setBusy(null);
    }
  }

  async function copyText() {
    await Clipboard.setStringAsync(noteToPlainText(note));
    showAlert({ title: "Copied", message: "The note was copied as plain text." });
  }

  function amaniLink() {
    showAlert({
      title: "Amani link (coming soon)",
      message:
        "Opening a note directly inside a cell-group member's app needs a small sync backend, which isn't part of this concept build yet. For now, use one of the other formats.",
    });
  }

  function confirmDelete() {
    onClose();
    showAlert({
      title: "Delete this note?",
      message: `"${note.title || "Untitled note"}" will be permanently deleted from this device. This can't be undone.`,
      actions: [
        { label: "Delete", style: "destructive", onPress: onDelete },
        { label: "Cancel", style: "cancel" },
      ],
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Share this note</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {note.title || "Untitled note"}
              {verse ? ` · ${verse.reference}` : ""}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon size={16} />
          </Pressable>
        </View>

        <Row
          icon={<ImageCardIcon />}
          iconBg={colors.verseBg}
          title="Verse card (image)"
          subtitle="A shareable graphic for WhatsApp & Instagram"
          onPress={shareVerseImage}
          busy={busy === "image"}
        />

        {verseOptions.length > 1 ? (
          <View style={styles.verseChooser}>
            <Pressable
              onPress={() => setPickerOpen((o) => !o)}
              style={styles.verseChooserToggle}
              accessibilityRole="button"
              accessibilityLabel="Choose which verse the card uses"
            >
              <Text style={styles.verseChooserToggleText} numberOfLines={1}>
                Card verse: {verse?.reference ?? "None"}
              </Text>
              <ChevronDownIcon size={12} strokeWidth={2.5} />
            </Pressable>
            {pickerOpen ? (
              <View>
                <View style={styles.verseSearchBar}>
                  <SearchIcon size={14} color={colors.textMuted} />
                  <TextInput
                    value={verseSearch}
                    onChangeText={setVerseSearch}
                    placeholder="Search this note's points & verses"
                    placeholderTextColor={colors.textMuted}
                    style={styles.verseSearchInput}
                    autoCorrect={false}
                  />
                </View>
                <ScrollView style={styles.verseOptionList} keyboardShouldPersistTaps="handled">
                  {filteredOptions.map((o) => (
                    <Pressable
                      key={o.block.id}
                      onPress={() => {
                        setSelectedVerseId(o.block.id);
                        setPickerOpen(false);
                        setVerseSearch("");
                      }}
                      style={styles.verseOptionRow}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${o.block.reference} for the verse card`}
                    >
                      <Text style={styles.verseOptionRef}>{o.block.reference}</Text>
                      {o.context ? <Text style={styles.verseOptionContext}>Under: {o.context}</Text> : null}
                      <Text style={styles.verseOptionText} numberOfLines={1}>
                        {o.block.text}
                      </Text>
                    </Pressable>
                  ))}
                  {filteredOptions.length === 0 ? (
                    <Text style={styles.verseOptionEmpty}>No points or verses match that search.</Text>
                  ) : null}
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : null}
        <Row
          icon={<DocumentIcon />}
          iconBg="#EEF2F6"
          title="Full note (PDF)"
          subtitle="Note text and verse, formatted as a document"
          onPress={sharePdf}
          busy={busy === "pdf"}
        />
        <Row
          icon={<ClipboardIcon />}
          iconBg="#EEF2F6"
          title="Plain text"
          subtitle="Copy the note as text, for email or messages"
          onPress={copyText}
        />
        <Row
          icon={<LinkIcon />}
          iconBg="#EEF2F6"
          title="Amani link"
          subtitle="Opens inside Amani for a cell-group member who has the app"
          onPress={amaniLink}
        />
        <Row
          icon={<TrashIcon color={colors.danger} />}
          iconBg="#FBEAE6"
          title="Delete note"
          subtitle="Permanently remove this note from this device"
          onPress={confirmDelete}
          destructive
          last
        />
      </View>

      {/* Offscreen verse-card render target for image capture. */}
      <View style={[styles.offscreen, { pointerEvents: "none" }]}>
        <VerseImageCard
          ref={shotRef}
          verseText={verse?.text ?? note.title}
          reference={verse?.reference}
          footerTitle={note.title || "Amani note"}
          footerMeta={[note.church, note.date].filter(Boolean).join(" · ")}
        />
      </View>
    </Modal>
  );
}

function Row({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
  busy,
  last,
  destructive,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  busy?: boolean;
  last?: boolean;
  destructive?: boolean;
}) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={[styles.row, !last && styles.rowBorder, busy && { opacity: 0.5 }]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, destructive && { color: colors.danger }]}>{title}</Text>
        <Text style={styles.rowSubtitle}>{busy ? "Preparing…" : subtitle}</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 34,
  },
  grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#E2DED2", alignSelf: "center", marginBottom: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12, gap: 12 },
  title: { fontFamily: fontFamily.serifBold, fontSize: 18, color: colors.textPrimary },
  subtitle: { fontFamily: fontFamily.sansMedium, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, minHeight: 44 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontFamily: fontFamily.sansBold, fontSize: 14.5, color: colors.textPrimary },
  rowSubtitle: { fontFamily: fontFamily.sansRegular, fontSize: 12, color: colors.textMuted, marginTop: 1 },

  offscreen: { position: "absolute", top: 0, left: -9999, width: VERSE_CARD_WIDTH, height: VERSE_CARD_HEIGHT },

  verseChooser: { marginTop: -4, marginBottom: 4 },
  verseChooserToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 58,
  },
  verseChooserToggleText: { fontFamily: fontFamily.sansSemibold, fontSize: 12, color: colors.textMuted, flexShrink: 1 },
  verseSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 58,
    marginBottom: 8,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  verseSearchInput: { flex: 1, fontFamily: fontFamily.sansRegular, fontSize: 13, color: colors.textPrimary },
  verseOptionList: { maxHeight: 160, marginLeft: 58 },
  verseOptionRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  verseOptionRef: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.navy },
  verseOptionContext: { fontFamily: fontFamily.sansMedium, fontSize: 11, color: colors.gold, marginTop: 1 },
  verseOptionText: { fontFamily: fontFamily.sansRegular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  verseOptionEmpty: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: 10,
  },
  });
}
