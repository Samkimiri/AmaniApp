import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputContentSizeChangeEventData,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Audio, type AVPlaybackStatus } from "expo-av";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import {
  CameraIcon,
  ChevronLeftIcon,
  HeadingIcon,
  ImagePlaceholderIcon,
  MicIcon,
  OpenBookIcon,
  RedoIcon,
  ShareArrowIcon,
  StopIcon,
  TagIcon,
  TrashIcon,
  UndoIcon,
} from "@/components/icons";
import { VerseCallout } from "@/components/VerseCallout";
import { ColorSwatchRow } from "@/components/ColorSwatchRow";
import { SwipeToDelete } from "@/components/SwipeToDelete";
import { AudioBlockRow } from "@/components/AudioBlockRow";
import { ShareSheet } from "@/components/ShareSheet";
import { getVerseCandidates, useActiveTranslation, VerseResult } from "@/data/bible";
import { notesStore } from "@/data/notesStore";
import { persistRecording, resolvePlayableUri, resolvePlayableUriAsDataUrl } from "@/data/audioStorage";
import { formatDuration, NoteBlock, newId, SermonNote } from "@/types/note";
import { useAlert } from "@/context/AlertContext";

function isBlankNote(note: SermonNote): boolean {
  return (
    !note.title.trim() &&
    !note.church?.trim() &&
    !note.preacher?.trim() &&
    !(note.tags && note.tags.length > 0) &&
    note.blocks.every((b) => b.type === "text" && !b.text.trim())
  );
}

// How many undo steps to keep — generous for a single editing session
// without letting the history array grow unbounded over a long one.
const MAX_HISTORY = 100;

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
  const translationCode = useActiveTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [note, setNote] = useState<SermonNote>(() => emptyNote(isNew ? newId() : id));
  const [loaded, setLoaded] = useState(isNew);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [verseBarOpen, setVerseBarOpen] = useState(false);
  const [verseQuery, setVerseQuery] = useState("");
  const [tagBarOpen, setTagBarOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const [shareOpen, setShareOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  // A short delay before actually leaving focus mode on blur, so tabbing
  // from one text field straight into another (e.g. title -> body) doesn't
  // flash the header/toolbar back in for a single frame in between.
  const focusExitTimer = useRef<ReturnType<typeof setTimeout>>();
  const showAlert = useAlert();

  function handleTypingFocus() {
    if (focusExitTimer.current) clearTimeout(focusExitTimer.current);
    setFocusMode(true);
  }

  function handleTypingBlur() {
    focusExitTimer.current = setTimeout(() => setFocusMode(false), 80);
  }

  // On web, a multiline TextInput renders as a plain <textarea>, which the
  // browser gives a fixed default height and a drag handle — a boxed,
  // scrollable little widget rather than something that reads like part of
  // an open page. Tracking each block's actual content height (native does
  // this growth automatically; the web renderer needs it done by hand) and
  // feeding it back in as that block's height makes the field grow with
  // what's typed instead, so a subheading followed by a full paragraph
  // just keeps flowing down the page like one continuous document.
  const [blockHeights, setBlockHeights] = useState<Record<string, number>>({});

  function autoGrow(blockId: string, minHeight: number) {
    return (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      setBlockHeights((h) => ({ ...h, [blockId]: Math.max(minHeight, e.nativeEvent.contentSize.height) }));
    };
  }

  const openFieldStyle = Platform.OS === "web" ? ({ resize: "none", overflow: "hidden" } as const) : null;

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingBlockId, setPlayingBlockId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playingObjectUrlRef = useRef<string | null>(null);
  // Mirrors `recording` state for the unmount-cleanup effect below, which
  // (correctly) has an empty dependency array so it only runs once and
  // only ever sees a ref's *current* value, not a captured one — reading
  // the `recording` state variable there instead would always see it as
  // `null` (its value on first render), silently failing to stop the mic
  // if the screen unmounts mid-recording via some path other than the
  // Back button (which now stops it explicitly — see goBack below).
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      if (playingObjectUrlRef.current) URL.revokeObjectURL(playingObjectUrlRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      if (focusExitTimer.current) clearTimeout(focusExitTimer.current);
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

  // Undo/redo history — a debounced checkpoint per pause in typing (not
  // one per keystroke, which would make a single held-down backspace or a
  // fast sentence take dozens of undo steps to get through). `skipHistoryRef`
  // stops an undo/redo's own `setNote` call from being recorded as a new
  // edit, which would otherwise make "redo" unreachable the instant you hit
  // "undo" once.
  const historyRef = useRef<SermonNote[]>([]);
  const historyIndexRef = useRef(-1);
  const skipHistoryRef = useRef(false);
  const historyTimer = useRef<ReturnType<typeof setTimeout>>();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    if (historyTimer.current) clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(() => {
      historyTimer.current = undefined;
      const idx = historyIndexRef.current;
      const stack = historyRef.current.slice(0, idx + 1);
      stack.push(note);
      const trimmed = stack.length > MAX_HISTORY ? stack.slice(stack.length - MAX_HISTORY) : stack;
      historyRef.current = trimmed;
      historyIndexRef.current = trimmed.length - 1;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
    }, 500);
    return () => {
      if (historyTimer.current) clearTimeout(historyTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, loaded]);

  /** Commits whatever hasn't been checkpointed yet (the debounce above
   * hasn't fired), so hitting undo right after typing doesn't silently
   * throw away the in-progress edit before stepping back past it. */
  function commitPendingHistory() {
    if (!historyTimer.current) return;
    clearTimeout(historyTimer.current);
    historyTimer.current = undefined;
    const idx = historyIndexRef.current;
    const stack = historyRef.current.slice(0, idx + 1);
    stack.push(note);
    historyRef.current = stack;
    historyIndexRef.current = stack.length - 1;
  }

  function undo() {
    commitPendingHistory();
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    historyIndexRef.current = idx - 1;
    skipHistoryRef.current = true;
    setNote(historyRef.current[idx - 1]);
    setCanUndo(idx - 1 > 0);
    setCanRedo(true);
  }

  function redo() {
    const idx = historyIndexRef.current;
    if (idx >= historyRef.current.length - 1) return;
    historyIndexRef.current = idx + 1;
    skipHistoryRef.current = true;
    setNote(historyRef.current[idx + 1]);
    setCanUndo(true);
    setCanRedo(idx + 1 < historyRef.current.length - 1);
  }

  // Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or +Y) — web only, since native has no
  // physical keyboard shortcut convention for this.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  const verseSuggestions = useMemo<VerseResult[]>(
    () => (verseQuery.trim() ? getVerseCandidates(verseQuery, 4) : []),
    [verseQuery, translationCode]
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

  function addHeading() {
    appendBlock({ id: newId(), type: "heading", text: "" });
  }

  function updateHeadingBlock(blockId: string, text: string) {
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) => (b.id === blockId && b.type === "heading" ? { ...b, text } : b)),
    }));
  }

  function updateVerseColor(blockId: string, color: string) {
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) => (b.id === blockId && b.type === "verse" ? { ...b, color } : b)),
    }));
  }

  function removeBlock(blockId: string) {
    setNote((n) => {
      const blocks = n.blocks.filter((b) => b.id !== blockId);
      // Never leave a note with zero blocks — there'd be nowhere left to
      // tap to keep typing.
      return { ...n, blocks: blocks.length > 0 ? blocks : [{ id: newId(), type: "text", text: "" }] };
    });
  }

  function addTag() {
    const tag = tagInput.trim().replace(/,$/, "");
    if (!tag) return;
    setNote((n) => {
      const existing = n.tags ?? [];
      if (existing.some((t) => t.toLowerCase() === tag.toLowerCase())) return n;
      return { ...n, tags: [...existing, tag] };
    });
    setTagInput("");
  }

  function removeTag(tag: string) {
    setNote((n) => ({ ...n, tags: (n.tags ?? []).filter((t) => t !== tag) }));
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

  /** Stops an in-progress recording and turns it into an audio block, if
   * it captured anything. Doesn't touch `note`/`setNote` itself — callers
   * decide how to fold the result in, since `goBack` needs the block
   * immediately (not after an async setState round-trip) to correctly
   * save the note it belongs to before navigating away. */
  async function stopRecordingAndGetBlock(activeRecording: Audio.Recording): Promise<NoteBlock | null> {
    try {
      await activeRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const status = await activeRecording.getStatusAsync();
      const uri = activeRecording.getURI();
      if (!uri) return null;
      const blockId = newId();
      const persistedUri = await persistRecording(uri, blockId);
      return {
        id: blockId,
        type: "audio",
        uri: persistedUri,
        durationMillis: status.durationMillis ?? recordingDuration,
      };
    } catch (err) {
      showAlert({ title: "Couldn't save the recording", message: String(err) });
      return null;
    } finally {
      setRecording(null);
      recordingRef.current = null;
      setRecordingDuration(0);
    }
  }

  async function toggleRecording() {
    if (recording) {
      const block = await stopRecordingAndGetBlock(recording);
      if (block) appendBlock(block);
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
      recordingRef.current = rec;
      setRecordingDuration(0);
    } catch (err) {
      showAlert({ title: "Couldn't start recording", message: String(err) });
    }
  }

  function releasePlayingObjectUrl() {
    if (playingObjectUrlRef.current) {
      URL.revokeObjectURL(playingObjectUrlRef.current);
      playingObjectUrlRef.current = null;
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
      releasePlayingObjectUrl();
    }

    async function loadAndPlay(uri: string) {
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingBlockId(block.id);
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingBlockId(null);
        }
      });
    }

    try {
      const playableUri = await resolvePlayableUri(block.uri);
      if (playableUri.startsWith("blob:")) playingObjectUrlRef.current = playableUri;
      await loadAndPlay(playableUri);
    } catch (err) {
      // Some browsers refuse a blob: URL for <audio> in certain contexts;
      // retry once with a base64 data: URI, which takes a different,
      // more universally-supported loading path.
      try {
        const fallbackUri = await resolvePlayableUriAsDataUrl(block.uri);
        if (!fallbackUri) throw err;
        await loadAndPlay(fallbackUri);
      } catch (fallbackErr) {
        showAlert({ title: "Couldn't play this recording", message: String(fallbackErr) });
      }
    }
  }

  async function goBack() {
    // Leaving mid-recording used to just abandon it — the mic/recorder
    // session was never stopped at all, leaking the resource (and on web,
    // leaving the browser's "microphone in use" indicator on) with no UI
    // left to stop it. Stop and keep the recording, same as tapping the
    // mic button would, before doing anything else.
    let finalNote = note;
    if (recordingRef.current) {
      const block = await stopRecordingAndGetBlock(recordingRef.current);
      if (block) {
        finalNote = {
          ...finalNote,
          blocks: [...finalNote.blocks, block, { id: newId(), type: "text", text: "" }],
        };
        setNote(finalNote);
      }
    }

    if (isBlankNote(finalNote)) {
      // Covers both "never saved" and "typed something, then deleted it
      // all again" — either way there's nothing worth keeping.
      await notesStore.remove(finalNote.id);
    } else {
      await notesStore.save({ ...finalNote, updatedAt: new Date().toISOString() });
    }
    router.back();
  }

  function confirmDeleteNote() {
    showAlert({
      title: "Delete this note?",
      message: `"${note.title || "Untitled note"}" will be permanently deleted from this device. This can't be undone.`,
      actions: [
        {
          label: "Delete",
          style: "destructive",
          onPress: async () => {
            await notesStore.remove(note.id);
            router.back();
          },
        },
        { label: "Cancel", style: "cancel" },
      ],
    });
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        {focusMode ? (
          <View style={styles.focusBar}>
            <Pressable
              onPress={() => Keyboard.dismiss()}
              style={styles.doneButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Done typing"
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.header}>
            <Pressable
              onPress={goBack}
              style={styles.headerButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
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
            <View style={styles.headerActions}>
              <Pressable
                onPress={confirmDeleteNote}
                style={styles.headerButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Delete note"
              >
                <TrashIcon size={19} color={colors.danger} />
              </Pressable>
              <Pressable
                onPress={() => setShareOpen(true)}
                style={styles.headerButtonDark}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Share this note"
              >
                <ShareArrowIcon size={17} color={colors.white} />
              </Pressable>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            value={note.title}
            onChangeText={(title) => setNote((n) => ({ ...n, title }))}
            onFocus={handleTypingFocus}
            onBlur={handleTypingBlur}
            onContentSizeChange={autoGrow("title", 29)}
            placeholder="Note title"
            placeholderTextColor={colors.textFaint}
            style={[styles.titleInput, openFieldStyle, { minHeight: blockHeights["title"] ?? 29 }]}
            multiline
            scrollEnabled={false}
          />
          <TextInput
            value={note.preacher ?? ""}
            onChangeText={(preacher) => setNote((n) => ({ ...n, preacher }))}
            onFocus={handleTypingFocus}
            onBlur={handleTypingBlur}
            placeholder="Add preacher"
            placeholderTextColor={colors.textFaint}
            style={styles.preacherInput}
          />
          {note.tags && note.tags.length > 0 ? (
            <View style={styles.tagChipRow}>
              {note.tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => removeTag(tag)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove tag ${tag}`}
                >
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <Text style={styles.tagChipRemove}>×</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {note.blocks.map((block) => {
            if (block.type === "text") {
              return (
                <TextInput
                  key={block.id}
                  value={block.text}
                  onChangeText={(text) => updateTextBlock(block.id, text)}
                  onFocus={handleTypingFocus}
                  onBlur={handleTypingBlur}
                  onContentSizeChange={autoGrow(block.id, 26)}
                  placeholder="Start typing your notes…"
                  placeholderTextColor={colors.textFaint}
                  style={[styles.bodyInput, openFieldStyle, { minHeight: blockHeights[block.id] ?? 26 }]}
                  multiline
                  scrollEnabled={false}
                />
              );
            }
            if (block.type === "heading") {
              return (
                <View key={block.id} style={styles.headingRow}>
                  <TextInput
                    value={block.text}
                    onChangeText={(text) => updateHeadingBlock(block.id, text)}
                    onFocus={handleTypingFocus}
                    onBlur={handleTypingBlur}
                    onContentSizeChange={autoGrow(block.id, 22)}
                    placeholder="Subheading"
                    placeholderTextColor={colors.textFaint}
                    style={[
                      styles.headingInput,
                      openFieldStyle,
                      { minHeight: blockHeights[block.id] ?? 22, flex: 1 },
                    ]}
                    multiline
                    scrollEnabled={false}
                  />
                  <Pressable
                    onPress={() => removeBlock(block.id)}
                    hitSlop={8}
                    style={styles.headingRemoveButton}
                    accessibilityRole="button"
                    accessibilityLabel="Remove subheading"
                  >
                    <TrashIcon size={14} color={colors.textFaint} />
                  </Pressable>
                </View>
              );
            }
            if (block.type === "verse") {
              const pickerOpen = colorPickerFor === block.id;
              return (
                <SwipeToDelete key={block.id} onDelete={() => removeBlock(block.id)}>
                  <Pressable
                    onPress={() => setColorPickerFor(pickerOpen ? null : block.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Change this verse's background color"
                  >
                    <VerseCallout reference={block.reference} text={block.text} color={block.color} />
                  </Pressable>
                  {pickerOpen ? (
                    <View style={styles.colorPickerRow}>
                      <ColorSwatchRow
                        selected={block.color ?? "gold"}
                        onSelect={(color) => updateVerseColor(block.id, color)}
                      />
                    </View>
                  ) : null}
                </SwipeToDelete>
              );
            }
            if (block.type === "audio") {
              return (
                <SwipeToDelete key={block.id} onDelete={() => removeBlock(block.id)}>
                  <AudioBlockRow
                    durationMillis={block.durationMillis}
                    isPlaying={playingBlockId === block.id}
                    onToggle={() => togglePlayback(block)}
                  />
                </SwipeToDelete>
              );
            }
            return (
              <SwipeToDelete key={block.id} onDelete={() => removeBlock(block.id)}>
                <View style={styles.imageBlock}>
                  <Image source={{ uri: block.uri }} style={styles.image} />
                  <View style={styles.imageCaption}>
                    <ImagePlaceholderIcon size={14} />
                    <Text style={styles.imageCaptionText}>Photo attached to this note</Text>
                  </View>
                </View>
              </SwipeToDelete>
            );
          })}
        </ScrollView>

        {recording ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording… {formatDuration(recordingDuration)}</Text>
            <Pressable
              style={styles.stopButton}
              onPress={toggleRecording}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Stop recording"
            >
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

        {tagBarOpen ? (
          <View style={styles.verseBar}>
            {note.tags && note.tags.length > 0 ? (
              <View style={styles.tagChipRow}>
                {note.tags.map((tag) => (
                  <Pressable
                    key={tag}
                    style={styles.tagChip}
                    onPress={() => removeTag(tag)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove tag ${tag}`}
                  >
                    <Text style={styles.tagChipText}>{tag}</Text>
                    <Text style={styles.tagChipRemove}>×</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <TextInput
              autoFocus
              value={tagInput}
              onChangeText={(text) => {
                if (text.endsWith(",")) {
                  setTagInput(text);
                  addTag();
                } else {
                  setTagInput(text);
                }
              }}
              onSubmitEditing={addTag}
              placeholder="Type a tag and press enter — e.g. Prayer"
              placeholderTextColor={colors.textFaint}
              style={styles.verseBarInput}
              returnKeyType="done"
            />
          </View>
        ) : null}

        {!focusMode ? (
          <View style={styles.toolbar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={styles.toolbarScroll}
            >
              <Pressable
                style={[styles.toolbarButton, !canUndo && styles.toolbarButtonDisabled]}
                onPress={undo}
                disabled={!canUndo}
                accessibilityRole="button"
                accessibilityLabel="Undo"
              >
                <UndoIcon size={18} color={canUndo ? colors.textSecondary : colors.textFaint} />
              </Pressable>
              <Pressable
                style={[styles.toolbarButton, !canRedo && styles.toolbarButtonDisabled]}
                onPress={redo}
                disabled={!canRedo}
                accessibilityRole="button"
                accessibilityLabel="Redo"
              >
                <RedoIcon size={18} color={canRedo ? colors.textSecondary : colors.textFaint} />
              </Pressable>
              <Pressable
                style={[styles.toolbarButton, recording && styles.toolbarButtonRecording]}
                onPress={toggleRecording}
                accessibilityRole="button"
                accessibilityLabel={recording ? "Stop recording" : "Record audio"}
              >
                <MicIcon size={18} color={recording ? colors.white : colors.textSecondary} />
              </Pressable>
              <Pressable
                style={styles.toolbarButton}
                onPress={addPhoto}
                accessibilityRole="button"
                accessibilityLabel="Add a photo"
              >
                <CameraIcon size={18} />
              </Pressable>
              <Pressable
                style={styles.toolbarButton}
                onPress={addHeading}
                accessibilityRole="button"
                accessibilityLabel="Add a subheading"
              >
                <HeadingIcon size={18} />
              </Pressable>
              <Pressable
                style={[styles.toolbarButton, verseBarOpen && styles.toolbarButtonActive]}
                onPress={() => setVerseBarOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Insert a Bible verse"
              >
                <OpenBookIcon size={18} color={verseBarOpen ? colors.verseText : colors.textSecondary} />
              </Pressable>
              <Pressable
                style={[styles.toolbarButton, tagBarOpen && styles.toolbarButtonActive]}
                onPress={() => setTagBarOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Tags"
              >
                <TagIcon size={18} color={tagBarOpen ? colors.verseText : colors.textSecondary} />
              </Pressable>
            </ScrollView>
            <View style={styles.savedRow}>
              <View style={[styles.savedDot, saveState === "saving" && { backgroundColor: colors.textFaint }]} />
              <Text style={styles.savedText}>{saveState === "saving" ? "Saving…" : "Saved"}</Text>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        note={note}
        onDelete={async () => {
          await notesStore.remove(note.id);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  focusBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  doneButton: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: { fontFamily: fontFamily.sansBold, fontSize: 13, color: colors.white },
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
  preacherInput: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 13,
    color: colors.textSecondary,
    padding: 0,
    marginTop: -8,
  },
  tagChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.verseBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 30,
  },
  tagChipText: { fontFamily: fontFamily.sansBold, fontSize: 12, color: colors.verseText },
  tagChipRemove: { fontFamily: fontFamily.sansBold, fontSize: 13, color: colors.verseText, opacity: 0.6 },
  bodyInput: { fontFamily: fontFamily.sansRegular, fontSize: 15, lineHeight: 26, color: colors.textSecondary, padding: 0 },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 6 },
  headingInput: {
    fontFamily: fontFamily.sansExtraBold,
    fontSize: 15.5,
    lineHeight: 22,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: colors.navy,
    padding: 0,
  },
  headingRemoveButton: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  colorPickerRow: { marginTop: 8, paddingHorizontal: 2 },
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
  toolbarScroll: { flexDirection: "row", alignItems: "center", gap: 14 },
  toolbarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F2EA",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toolbarButtonActive: { backgroundColor: colors.verseBg },
  toolbarButtonRecording: { backgroundColor: "#FF6B5E" },
  toolbarButtonDisabled: { opacity: 0.4 },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  savedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  savedText: { fontFamily: fontFamily.sansMedium, fontSize: 11.5, color: colors.textMuted },
  });
}
