import React, { useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as Clipboard from "expo-clipboard";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { ClipboardIcon, CloseIcon, DocumentIcon, ImageCardIcon, LinkIcon, OpenBookIcon, TrashIcon } from "./icons";
import { firstVerseBlock, noteToHtml, noteToPlainText, SermonNote } from "@/types/note";
import { useAlert } from "@/context/AlertContext";

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  note: SermonNote;
  onDelete: () => void;
}

/** Triggers a real browser download of a data: URI — web only. */
function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
  const verse = firstVerseBlock(note);
  const showAlert = useAlert();

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
      if (Platform.OS === "web") {
        // expo-sharing's web fallback only works via navigator.share, which
        // is unsupported on most desktop browsers and isn't meant for
        // data: URIs — a direct file download works everywhere instead.
        downloadDataUrl(uri, "amani-verse-card.png");
      } else {
        await Sharing.shareAsync(uri, { mimeType: "image/png" });
      }
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
        <ViewShot ref={shotRef} options={{ format: "png", quality: 0.95 }}>
          <View style={styles.card}>
            <View style={styles.cardBrandRow}>
              <OpenBookIcon size={16} color={colors.goldLight} />
              <Text style={styles.cardBrand}>AMANI</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardQuoteMark}>&ldquo;</Text>
              <Text style={styles.cardVerseText}>{verse?.text ?? note.title}</Text>
              <View style={styles.cardRule} />
              {verse ? <Text style={styles.cardReference}>{verse.reference}</Text> : null}
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterTitle}>{note.title || "Amani note"}</Text>
              <Text style={styles.cardFooterMeta}>
                {[note.church, note.date].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>
        </ViewShot>
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
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={[styles.row, !last && styles.rowBorder, busy && { opacity: 0.5 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, destructive && { color: colors.danger }]}>{title}</Text>
        <Text style={styles.rowSubtitle}>{busy ? "Preparing…" : subtitle}</Text>
      </View>
    </Pressable>
  );
}

const CARD_WIDTH = 360;
const CARD_HEIGHT = 580;

const styles = StyleSheet.create({
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

  offscreen: { position: "absolute", top: 0, left: -9999, width: CARD_WIDTH, height: CARD_HEIGHT },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
    paddingHorizontal: 34,
  },
  cardBrandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardBrand: { fontFamily: fontFamily.sansExtraBold, fontSize: 13, letterSpacing: 2, color: colors.goldLight },
  cardBody: { alignItems: "center", gap: 16 },
  cardQuoteMark: { fontFamily: fontFamily.serifSemibold, fontSize: 46, color: colors.goldLight, opacity: 0.55 },
  cardVerseText: {
    fontFamily: fontFamily.serifSemibold,
    fontSize: 23,
    lineHeight: 33,
    color: colors.white,
    textAlign: "center",
  },
  cardRule: { width: 34, height: 2, backgroundColor: colors.goldLight },
  cardReference: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.goldLight,
  },
  cardFooter: { alignItems: "center", gap: 4 },
  cardFooterTitle: { fontFamily: fontFamily.sansBold, fontSize: 13, color: "#EDE7D8" },
  cardFooterMeta: { fontFamily: fontFamily.sansRegular, fontSize: 11.5, color: "#93A4BC" },
});
