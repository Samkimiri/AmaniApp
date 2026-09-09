import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Audio, type AVPlaybackStatus } from "expo-av";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import {
  CameraIcon,
  ChevronLeftIcon,
  ImagePlaceholderIcon,
  MicIcon,
  OpenBookIcon,
  ShareArrowIcon,
  StopIcon,
  TagIcon,
} from "@/components/icons";
import { VerseCallout } from "@/components/VerseCallout";
import { AudioBlockRow } from "@/components/AudioBlockRow";
import { ShareSheet } from "@/components/ShareSheet";
import { getVerseCandidates, VerseResult } from "@/data/bible";
import { notesStore } from "@/data/notesStore";
import { formatDuration, NoteBlock, newId, SermonNote } from "@/types/note";
import { useAlert } from "@/context/AlertContext";

function isBlankNote(note: SermonNote): boolean {
  return (
    !note.title.trim() &&
    !note.church?.trim() &&
    note.blocks.every((b) => b.type === "text" && !b.text.trim())
  );
}

function emptyNote(id: string): SermonNote {
  const now = new Date().toISOString();
  return {
    id,
    title: "",
    church: "",
    date: new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    blocks: [{ id: newId(), type: "text", text: "" }],
    createdAt: now,
    updatedAt: now,
  };
}

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const [note, setNote] = useState<SermonNote>(() => emptyNote(isNew ? newId() : id));
  const [loaded, setLoaded] = useState(isNew);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [verseBarOpen, setVerseBarOpen] = useState(false);
  const [verseQuery, setVerseQuery] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const [shareOpen, setShareOpen] = useState(false);
  const showAlert = useAlert();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingBlockId, setPlayingBlockId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      recording?.stopAndUnloadAsync().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNew) return;
    notesStore.getById(id).then((existing) => {
      if (existing) setNote(existing);
      setLoaded(true);
    });
  }, [id, isNew]);

  // Debounced autosave whenever the note changes — but never persist a
  // still-blank note, so opening "New sermon note" and backing out without
  // typing anything doesn't leave a ghost "Untitled note" in the list.
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (isBlankNote(note)) {
      setSaveState("saved");
      return;
    }
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      await notesStore.save({ ...note, updatedAt: new Date().toISOString() });
      setSaveState("saved");
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, loaded]);

  const verseSuggestions = useMemo<VerseResult[]>(
    () => (verseQuery.trim() ? getVerseCandidates(verseQuery, 4) : []),
    [verseQuery]
  );

  function updateTextBlock(blockId: string, text: string) {
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) => (b.id === blockId && b.type === "text" ? { ...b, text } : b)),
    }));
  }

  function appendBlock(block: NoteBlock) {
    setNote((n) => {
      const blocks = [...n.blocks, block];
      if (block.type !== "text") {
        blocks.push({ id: newId(), type: "text", text: "" });
      }
      return { ...n, blocks };
    });
  }

  function insertVerse(v: VerseResult) {
    appendBlock({ id: newId(), type: "verse", reference: v.reference, text: v.text });
    setVerseQuery("");
    setVerseBarOpen(false);
  }

  function addPhoto() {
    showAlert({
      title: "Add a photo",
      message: "Photograph a sermon slide, or choose one you've already saved.",
      actions: [
        { label: "Take Photo", onPress: capturePhoto },
        { label: "Choose from Library", onPress: pickFromLibrary },
        { label: "Cancel", style: "cancel" },
      ],
    });
  }

  async function capturePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert({ title: "Camera access needed", message: "Allow camera access to photograph a sermon slide." });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      appendBlock({ id: newId(), type: "image", uri: result.assets[0].uri });
    }
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert({ title: "Photo access needed", message: "Allow photo access to attach a picture to this note." });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      appendBlock({ id: newId(), type: "image", uri: result.assets[0].uri });
    }
  }

  async function toggleRecording() {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const status = await recording.getStatusAsync();
        const uri = recording.getURI();
        if (uri) {
          appendBlock({
            id: newId(),
            type: "audio",
            uri,
            durationMillis: status.durationMillis ?? recordingDuration,
          });
        }
      } catch (err) {
        showAlert({ title: "Couldn't save the recording", message: String(err) });
      } finally {
        setRecording(null);
        setRecordingDuration(0);
      }
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        showAlert({ title: "Microphone access needed", message: "Allow microphone access to record sermon audio." });
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => setRecordingDuration(status.durationMillis ?? 0),
        200
      );
      setRecording(rec);
      setRecordingDuration(0);
    } catch (err) {
      showAlert({ title: "Couldn't start recording", message: String(err) });
    }
  }

  async function togglePlayback(block: Extract<NoteBlock, { type: "audio" }>) {
    if (playingBlockId === block.id) {
      await soundRef.current?.pauseAsync();
      setPlayingBlockId(null);
      return;
    }

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: block.uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingBlockId(block.id);
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingBlockId(null);
        }
      });
    } catch (err) {
      showAlert({ title: "Couldn't play this recording", message: String(err) });
    }
  }

  async function goBack() {
    if (isBlankNote(note)) {
      // Covers both "never saved" and "typed something, then deleted it
      // all again" — either way there's nothing worth keeping.
      await notesStore.remove(note.id);
    } else {
      await notesStore.save({ ...note, updatedAt: new Date().toISOString() });
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.headerButton} hitSlop={8}>
            <ChevronLeftIcon size={20} />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <TextInput
              value={note.church}
              onChangeText={(church) => setNote((n) => ({ ...n, church }))}
              placeholder="Add church / series"
              placeholderTextColor={colors.textFaint}
              style={styles.churchInput}
            />
            <Text style={styles.dateText}>{note.date}</Text>
          </View>
          <Pressable onPress={() => setShareOpen(true)} style={styles.headerButtonDark} hitSlop={8}>
            <ShareArrowIcon size={17} color={colors.white} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            value={note.title}
            onChangeText={(title) => setNote((n) => ({ ...n, title }))}
            placeholder="Note title"
            placeholderTextColor={colors.textFaint}
            style={styles.titleInput}
            multiline
          />

          {note.blocks.map((block) => {
            if (block.type === "text") {
              return (
                <TextInput
                  key={block.id}
                  value={block.text}
                  onChangeText={(text) => updateTextBlock(block.id, text)}
                  placeholder="Start typing your notes…"
                  placeholderTextColor={colors.textFaint}
                  style={styles.bodyInput}
                  multiline
                />
              );
            }
            if (block.type === "verse") {
              return <VerseCallout key={block.id} reference={block.reference} text={block.text} />;
            }
            if (block.type === "audio") {
              return (
                <AudioBlockRow
                  key={block.id}
                  durationMillis={block.durationMillis}
                  isPlaying={playingBlockId === block.id}
                  onToggle={() => togglePlayback(block)}
                />
              );
            }
            return (
              <View key={block.id} style={styles.imageBlock}>
                <Image source={{ uri: block.uri }} style={styles.image} />
                <View style={styles.imageCaption}>
                  <ImagePlaceholderIcon size={14} />
                  <Text style={styles.imageCaptionText}>Photo attached to this note</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {recording ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording… {formatDuration(recordingDuration)}</Text>
            <Pressable style={styles.stopButton} onPress={toggleRecording} hitSlop={8}>
              <StopIcon size={13} />
            </Pressable>
          </View>
        ) : null}

        {verseBarOpen ? (
          <View style={styles.verseBar}>
            <TextInput
              autoFocus
              value={verseQuery}
              onChangeText={setVerseQuery}
              placeholder="Type a reference — e.g. 2 Cor 5:7"
              placeholderTextColor={colors.textFaint}
              style={styles.verseBarInput}
            />
            {verseSuggestions.map((v) => (
              <Pressable key={v.reference} style={styles.suggestionRow} onPress={() => insertVerse(v)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionRef}>{v.reference}</Text>
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    &ldquo;{v.text}&rdquo;
                  </Text>
                </View>
                <View style={styles.insertButton}>
                  <Text style={styles.insertButtonText}>Insert</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.toolbar}>
          <Pressable
            style={[styles.toolbarButton, recording && styles.toolbarButtonRecording]}
            onPress={toggleRecording}
          >
            <MicIcon size={18} color={recording ? colors.white : colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={addPhoto}>
            <CameraIcon size={18} />
          </Pressable>
          <Pressable
            style={[styles.toolbarButton, verseBarOpen && styles.toolbarButtonActive]}
            onPress={() => setVerseBarOpen((v) => !v)}
          >
            <OpenBookIcon size={18} color={verseBarOpen ? colors.verseText : colors.textSecondary} />
          </Pressable>
          <Pressable
            style={styles.toolbarButton}
            onPress={() =>
              showAlert({ title: "Tags", message: "Organizing notes by tag isn't wired up in this concept build yet." })
            }
          >
            <TagIcon size={18} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={styles.savedRow}>
            <View style={[styles.savedDot, saveState === "saving" && { backgroundColor: colors.textFaint }]} />
            <Text style={styles.savedText}>{saveState === "saving" ? "Saving…" : "Saved"}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ShareSheet visible={shareOpen} onClose={() => setShareOpen(false)} note={note} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerButtonDark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  churchInput: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12.5,
    color: colors.textPrimary,
    textAlign: "center",
    minWidth: 140,
    padding: 0,
  },
  dateText: { fontFamily: fontFamily.sansMedium, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  content: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: 24, gap: 14 },
  titleInput: { fontFamily: fontFamily.serifBold, fontSize: 22, lineHeight: 29, color: colors.textPrimary, padding: 0 },
  bodyInput: { fontFamily: fontFamily.sansRegular, fontSize: 15, lineHeight: 26, color: colors.textSecondary, padding: 0 },
  imageBlock: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  image: { width: "100%", height: 180, backgroundColor: "#EFE7D8" },
  imageCaption: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  imageCaptionText: { fontFamily: fontFamily.sansMedium, fontSize: 12.5, color: colors.textSecondary },

  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B5E" },
  recordingText: { flex: 1, fontFamily: fontFamily.sansBold, fontSize: 13, color: colors.white },
  stopButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  verseBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  verseBarInput: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 12,
    padding: 10,
  },
  suggestionRef: { fontFamily: fontFamily.sansExtraBold, fontSize: 11, letterSpacing: 0.5, color: colors.navy, textTransform: "uppercase" },
  suggestionText: { fontFamily: fontFamily.sansRegular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  insertButton: { height: 36, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  insertButtonText: { fontFamily: fontFamily.sansBold, fontSize: 12, color: colors.white },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  toolbarButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F5F2EA", alignItems: "center", justifyContent: "center" },
  toolbarButtonActive: { backgroundColor: colors.verseBg },
  toolbarButtonRecording: { backgroundColor: "#FF6B5E" },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  savedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  savedText: { fontFamily: fontFamily.sansMedium, fontSize: 11.5, color: colors.textMuted },
});
