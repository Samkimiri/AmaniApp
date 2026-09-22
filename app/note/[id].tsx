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
  ChecklistIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HeadingIcon,
  HighlightIcon,
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
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { ColorSwatchRow } from "@/components/ColorSwatchRow";
import { SwipeToDelete } from "@/components/SwipeToDelete";
import { AudioBlockRow } from "@/components/AudioBlockRow";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "@/lib/speechRecognition";
import { ShareSheet } from "@/components/ShareSheet";
import { getVerseCandidates, useActiveTranslation, VerseResult } from "@/data/bible";
import { notesStore } from "@/data/notesStore";
import { persistRecording, resolvePlayableUri, resolvePlayableUriAsDataUrl } from "@/data/audioStorage";
import { formatDuration, NoteBlock, newId, SermonNote } from "@/types/note";
import { getNoteTemplate } from "@/data/noteTemplates";
import { extractNoteReferences, ScriptureRef } from "@/lib/scriptureRefs";
import { useAlert } from "@/context/AlertContext";
import { useHint } from "@/hooks/useHint";
import { HintBanner } from "@/components/HintBanner";

function isBlankNote(note: SermonNote): boolean {
  return (
    !note.title.trim() &&
    !note.church?.trim() &&
    !note.preacher?.trim() &&
    !(note.tags && note.tags.length > 0) &&
    // A heading (or an all-empty checklist) counts as structure, not
    // content — a fresh templated note (all headings, no typing yet)
    // should still be discardable, same as a truly blank one.
    note.blocks.every(
      (b) =>
        b.type === "heading" ||
        (b.type === "text" && !b.text.trim()) ||
        (b.type === "checklist" && b.items.every((i) => !i.text.trim()))
    )
  );
}

// How many undo steps to keep — generous for a single editing session
// without letting the history array grow unbounded over a long one.
const MAX_HISTORY = 100;

function emptyNote(id: string, templateId?: string): SermonNote {
  const now = new Date().toISOString();
  return {
    id,
    title: "",
    church: "",
    date: new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    blocks: getNoteTemplate(templateId).buildBlocks(),
    createdAt: now,
    updatedAt: now,
  };
}

export default function NoteEditorScreen() {
  const { id, template } = useLocalSearchParams<{ id: string; template?: string }>();
  const isNew = id === "new";
  const translationCode = useActiveTranslation();
  const colors = useColors();
  // makeStyles builds a large StyleSheet object graph; this screen
  // re-renders on every keystroke (typing, autosave state, undo history),
  // so recomputing it unconditionally every time was wasted work on every
  // single character typed. It only actually needs to change when the
  // theme does.
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [note, setNote] = useState<SermonNote>(() => emptyNote(isNew ? newId() : id, template));
  // expo-router's query params aren't always available on the very first
  // render on web (they can resolve a tick after mount), so the ?template=
  // param above is sometimes still undefined when this lazy initializer
  // runs, silently falling back to the blank template. Once `template`
  // actually arrives, apply it for real — this only matters for a note
  // that's still brand new and untouched, so it can't clobber typing.
  useEffect(() => {
    if (isNew && template) {
      setNote((n) => ({ ...n, blocks: getNoteTemplate(template).buildBlocks() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);
  const [loaded, setLoaded] = useState(isNew);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [verseBarOpen, setVerseBarOpen] = useState(false);
  const [verseQuery, setVerseQuery] = useState("");
  const [tagBarOpen, setTagBarOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const [shareOpen, setShareOpen] = useState(false);
  // Whether the bottom toolbar has more buttons than fit on screen — see
  // the fade/chevron hint rendered next to it below.
  const [toolbarOverflow, setToolbarOverflow] = useState(false);
  const toolbarContainerWidth = useRef(0);
  const toolbarContentWidth = useRef(0);
  function updateToolbarOverflow() {
    setToolbarOverflow(toolbarContentWidth.current > toolbarContainerWidth.current + 1);
  }
  const [focusMode, setFocusMode] = useState(false);
  // A short delay before actually leaving focus mode on blur, so tabbing
  // from one text field straight into another (e.g. title -> body) doesn't
  // flash the header/toolbar back in for a single frame in between.
  const focusExitTimer = useRef<ReturnType<typeof setTimeout>>();
  const showAlert = useAlert();
  const { visible: blockHintVisible, dismiss: dismissBlockHint } = useHint("note-editor-block-gestures");

  function handleTypingFocus() {
    if (focusExitTimer.current) clearTimeout(focusExitTimer.current);
    setFocusMode(true);
  }

  function handleTypingBlur() {
    focusExitTimer.current = setTimeout(() => setFocusMode(false), 80);
  }

  // Lightweight rich text: body paragraphs stay plain strings (so backup,
  // search, and plain-text sharing all keep working unchanged) but can
  // hold Markdown-style **bold**, *italic*, ==highlight==, and "- " bullets, applied via
  // the formatting bar and rendered properly in the PDF export.
  // `activeTextBlockId` tracks which body block the formatting buttons
  // should apply to; `selections` remembers each block's last known
  // cursor/selection range, since the formatting bar lives in the
  // focus-mode bar and is tapped *instead of* the text input, which would
  // otherwise lose the selection.
  const [activeTextBlockId, setActiveTextBlockId] = useState<string | null>(null);
  const selections = useRef<Record<string, { start: number; end: number }>>({});

  // Which text block is *currently* focused, as opposed to `activeTextBlockId`
  // above (which deliberately keeps pointing at the last-focused block even
  // after it blurs, so the formatting buttons don't disappear the instant
  // you tap one). A plain TextInput can only show one uniform style for its
  // whole value, so it can't display "**bold**" as actually bold while
  // you're typing it — every block that ISN'T this one instead renders
  // through MarkdownPreview, which turns the stored **bold**/*italic*/
  // ==highlight==/bullet markup into real styled text, the same as the
  // PDF export already does. Debounced the same 80ms as handleTypingBlur,
  // so clicking a formatting button (which blurs then immediately
  // refocuses the same input) doesn't flash it over to the rendered
  // preview and back.
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const blockBlurTimer = useRef<ReturnType<typeof setTimeout>>();
  // Set right before swapping a block from its rendered preview back to an
  // editable TextInput (tapping a paragraph to edit it) — the input doesn't
  // exist yet at the moment of the tap, so this tells its ref callback to
  // focus it (and place the cursor at the end) the instant it mounts.
  const pendingFocusBlockId = useRef<string | null>(null);

  function handleBlockFocus(blockId: string) {
    if (blockBlurTimer.current) clearTimeout(blockBlurTimer.current);
    handleTypingFocus();
    setActiveTextBlockId(blockId);
    setFocusedBlockId(blockId);
  }

  function handleBlockBlur() {
    handleTypingBlur();
    blockBlurTimer.current = setTimeout(() => setFocusedBlockId(null), 80);
  }

  function startEditingBlock(blockId: string, textLength: number) {
    pendingFocusBlockId.current = blockId;
    setActiveTextBlockId(blockId);
    setFocusedBlockId(blockId);
    setPendingSelection({ blockId, pos: textLength });
  }
  // On web, tapping any other element (a formatting button included) blurs
  // whatever <textarea> currently has focus — standard DOM behavior, not a
  // bug in this app, but it used to mean every tap on Bold/Italic/Bullet
  // silently closed the keyboard and dropped out of focus mode, forcing a
  // re-tap into the text just to keep typing. Refocusing the same input
  // synchronously, in the same handler that applied the format, restores
  // focus before the blur's 80ms exit timer (see handleTypingBlur) fires.
  const textInputRefs = useRef<Record<string, TextInput | null>>({});

  // Forces the visible cursor to a specific spot right after a formatting
  // button edits the text out from under it — the browser/native input
  // has no way to know where the new cursor "should" be after we've
  // spliced markers into the string, so without this it lands wherever
  // focus() happens to leave it (often the very start). Cleared on the
  // next tick so it doesn't fight normal typing afterward — see the
  // `selection` prop below, which only applies while this is set.
  const [pendingSelection, setPendingSelection] = useState<{ blockId: string; pos: number } | null>(null);
  useEffect(() => {
    if (!pendingSelection) return;
    const t = setTimeout(() => setPendingSelection(null), 0);
    return () => clearTimeout(t);
  }, [pendingSelection]);

  /** Records where a formatting edit left the cursor, both for the visible
   * selection nudge above and — just as importantly — so the *next*
   * formatting button reads a selection that matches the text as it now
   * exists. Without this, clicking Bold then Highlight right after (with
   * no click back into the text in between) applied the second marker at
   * the old, now-wrong offsets, since the text had grown out from under
   * the stale {start, end} left over from before the first edit. */
  function setCursorAfterEdit(blockId: string, pos: number) {
    selections.current[blockId] = { start: pos, end: pos };
    setPendingSelection({ blockId, pos });
  }

  function applyInlineFormat(blockId: string, marker: string) {
    const sel = selections.current[blockId] ?? { start: 0, end: 0 };
    let newCursor = 0;
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) => {
        if (b.id !== blockId || b.type !== "text") return b;
        const start = Math.min(sel.start, sel.end);
        const end = Math.max(sel.start, sel.end);
        const before = b.text.slice(0, start);
        const middle = b.text.slice(start, end) || "text";
        const after = b.text.slice(end);
        newCursor = before.length + marker.length + middle.length + marker.length;
        return { ...b, text: `${before}${marker}${middle}${marker}${after}` };
      }),
    }));
    setCursorAfterEdit(blockId, newCursor);
    textInputRefs.current[blockId]?.focus();
  }

  function applyBullet(blockId: string) {
    const sel = selections.current[blockId] ?? { start: 0, end: 0 };
    const cursor = Math.min(sel.start, sel.end);
    let newCursor = cursor;
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) => {
        if (b.id !== blockId || b.type !== "text") return b;
        const lineStart = b.text.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
        if (b.text.slice(lineStart, lineStart + 2) === "- ") return b; // already a bullet
        newCursor = cursor + 2;
        return { ...b, text: b.text.slice(0, lineStart) + "- " + b.text.slice(lineStart) };
      }),
    }));
    setCursorAfterEdit(blockId, newCursor);
    textInputRefs.current[blockId]?.focus();
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
  // Live captions while recording, native only (iOS/Android) — the OS's
  // own on-device speech recognizer, same engine used for dictation.
  // `liveCaption` is the current in-progress phrase (replaced as it's
  // refined); `finalTranscriptRef` accumulates each finished phrase for
  // the whole recording, since `continuous` mode emits one final result
  // per pause rather than one for the entire session.
  const [liveCaption, setLiveCaption] = useState("");
  const finalTranscriptRef = useRef("");

  // Dictating straight into a text block (as opposed to recording full
  // audio) — same on-device recognizer, a separate mode so the two never
  // run at once. Native only: browsers have no on-device speech API, and
  // routing audio through a browser's cloud recognizer would quietly
  // break the "nothing leaves your device" promise this feature makes
  // for the audio-recording transcript. `dictatingRef` mirrors the state
  // for the unmount-cleanup effect, same reasoning as `recordingRef`.
  const [dictatingBlockId, setDictatingBlockId] = useState<string | null>(null);
  const dictatingRef = useRef<string | null>(null);

  function setDictating(blockId: string | null) {
    dictatingRef.current = blockId;
    setDictatingBlockId(blockId);
  }

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    if (dictatingRef.current) {
      if (!event.isFinal) return;
      const blockId = dictatingRef.current;
      setNote((n) => ({
        ...n,
        blocks: n.blocks.map((b) => {
          if (b.id !== blockId || b.type !== "text") return b;
          const sep = b.text && !/\s$/.test(b.text) ? " " : "";
          return { ...b, text: b.text + sep + text };
        }),
      }));
      return;
    }
    if (event.isFinal) {
      finalTranscriptRef.current = `${finalTranscriptRef.current} ${text}`.trim();
      setLiveCaption("");
    } else {
      setLiveCaption(text);
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    // Captions/dictation are a bonus on top of typing, not a requirement
    // — never block or alert on this failing (permission denied, engine
    // busy, no network for the on-device model's first download).
    console.warn("Speech recognition unavailable:", event.error, event.message);
    if (dictatingRef.current) setDictating(null);
  });

  async function toggleDictate(blockId: string | null) {
    if (!blockId || Platform.OS === "web" || recording) return;
    if (dictatingRef.current === blockId) {
      ExpoSpeechRecognitionModule.stop();
      setDictating(null);
      return;
    }
    if (dictatingRef.current) ExpoSpeechRecognitionModule.stop();
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      showAlert({ title: "Microphone access needed", message: "Allow microphone access to dictate into this note." });
      return;
    }
    setDictating(blockId);
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition: true,
    });
  }
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
      if ((recordingRef.current || dictatingRef.current) && Platform.OS !== "web") ExpoSpeechRecognitionModule.stop();
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

  // Verses named in the typed text ("John 3:16") become tappable chips that
  // open the reader at that verse. `note.blocks` gets a new array identity
  // on every keystroke (immutable updates), so tying this scan directly to
  // it would re-run the full regex-and-lookup pass on every single
  // character typed anywhere in the note. Debounced the same way autosave
  // and undo history already are, so it only runs once typing pauses.
  const [scriptureRefs, setScriptureRefs] = useState<ScriptureRef[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => setScriptureRefs(extractNoteReferences(note)), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.title, note.blocks, translationCode]);

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

  function addChecklist() {
    appendBlock({ id: newId(), type: "checklist", items: [{ id: newId(), text: "", done: false }] });
  }

  function toggleChecklistItem(blockId: string, itemId: string) {
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) =>
        b.id === blockId && b.type === "checklist"
          ? { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
          : b
      ),
    }));
  }

  function updateChecklistItemText(blockId: string, itemId: string, text: string) {
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) =>
        b.id === blockId && b.type === "checklist"
          ? { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, text } : i)) }
          : b
      ),
    }));
  }

  function addChecklistItem(blockId: string, afterItemId?: string) {
    const newItem = { id: newId(), text: "", done: false };
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) => {
        if (b.id !== blockId || b.type !== "checklist") return b;
        if (!afterItemId) return { ...b, items: [...b.items, newItem] };
        const idx = b.items.findIndex((i) => i.id === afterItemId);
        const items = [...b.items];
        items.splice(idx + 1, 0, newItem);
        return { ...b, items };
      }),
    }));
  }

  function removeChecklistItem(blockId: string, itemId: string) {
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) => {
        if (b.id !== blockId || b.type !== "checklist") return b;
        const items = b.items.filter((i) => i.id !== itemId);
        // Never leave a checklist block with zero rows — clear the last
        // one instead, same as removeBlock does for the whole note.
        return { ...b, items: items.length > 0 ? items : [{ id: newId(), text: "", done: false }] };
      }),
    }));
  }

  function updateImageCaption(blockId: string, caption: string) {
    setNote((n) => ({
      ...n,
      blocks: n.blocks.map((b) => (b.id === blockId && b.type === "image" ? { ...b, caption } : b)),
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
    if (Platform.OS !== "web") {
      ExpoSpeechRecognitionModule.stop();
    }
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
        transcript: finalTranscriptRef.current.trim() || undefined,
      };
    } catch (err) {
      showAlert({ title: "Couldn't save the recording", message: String(err) });
      return null;
    } finally {
      setRecording(null);
      recordingRef.current = null;
      setRecordingDuration(0);
      finalTranscriptRef.current = "";
      setLiveCaption("");
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

      if (Platform.OS !== "web") {
        finalTranscriptRef.current = "";
        setLiveCaption("");
        const speechPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (speechPermission.granted) {
          // requiresOnDeviceRecognition is essential, not optional — without
          // it this library defaults to sending audio to a network speech
          // service (Apple's or Google's), which would make this feature
          // quietly contradict Amani's "nothing ever leaves your device"
          // privacy claim. On-device recognition needs a downloaded
          // language model (Android 13+) and isn't available on every
          // device/OS version; it just fails silently into no captions
          // for that recording rather than falling back to the network.
          ExpoSpeechRecognitionModule.start({
            lang: "en-US",
            interimResults: true,
            continuous: true,
            requiresOnDeviceRecognition: true,
          });
        }
        // If speech permission is denied, the recording itself still
        // proceeds without captions — this is a bonus feature, not a
        // requirement to record at all.
      }
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
            {activeTextBlockId ? (
              <View style={styles.formatButtons}>
                <Pressable
                  onPress={() => applyInlineFormat(activeTextBlockId, "**")}
                  style={styles.formatButton}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Bold"
                >
                  <Text style={styles.formatButtonTextBold}>B</Text>
                </Pressable>
                <Pressable
                  onPress={() => applyInlineFormat(activeTextBlockId, "*")}
                  style={styles.formatButton}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Italic"
                >
                  <Text style={styles.formatButtonTextItalic}>I</Text>
                </Pressable>
                <Pressable
                  onPress={() => applyBullet(activeTextBlockId)}
                  style={styles.formatButton}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Bullet list"
                >
                  <Text style={styles.formatButtonText}>&bull;</Text>
                </Pressable>
                <Pressable
                  onPress={() => applyInlineFormat(activeTextBlockId, "==")}
                  style={styles.formatButton}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Highlight"
                >
                  <HighlightIcon size={16} color={colors.gold} />
                </Pressable>
                {Platform.OS !== "web" ? (
                  <Pressable
                    onPress={() => toggleDictate(activeTextBlockId)}
                    disabled={!!recording}
                    style={[
                      styles.formatButton,
                      dictatingBlockId === activeTextBlockId && styles.formatButtonActive,
                      !!recording && styles.formatButtonDisabled,
                    ]}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={dictatingBlockId === activeTextBlockId ? "Stop dictating" : "Dictate into this block"}
                  >
                    <MicIcon size={15} color={dictatingBlockId === activeTextBlockId ? colors.white : colors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {dictatingBlockId ? <Text style={styles.dictatingLabel}>Listening…</Text> : null}
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
          {blockHintVisible ? (
            <HintBanner
              text="Swipe left on a photo, verse, or recording to remove it. Tap a verse to change its color."
              onDismiss={dismissBlockHint}
            />
          ) : null}
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

          {scriptureRefs.length > 0 ? (
            <View style={styles.scriptureRow}>
              <Text style={styles.scriptureLabel}>Scripture in this note</Text>
              <View style={styles.tagChipRow}>
                {scriptureRefs.map((ref) => (
                  <Pressable
                    key={ref.label}
                    style={styles.scriptureChip}
                    onPress={() =>
                      router.push(
                        `/bible-read?book=${encodeURIComponent(ref.book)}&chapter=${ref.chapter}&verse=${ref.verse}${
                          ref.endVerse ? `&endVerse=${ref.endVerse}` : ""
                        }`
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${ref.label} in the Bible`}
                  >
                    <Text style={styles.scriptureChipText}>{ref.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {note.blocks.map((block) => {
            if (block.type === "text") {
              // An empty block has nothing to render as a preview and needs
              // to be an obvious place to tap and start typing, so it's
              // always shown as the live input rather than ever swapping to
              // MarkdownPreview.
              const isEditing = focusedBlockId === block.id || !block.text.trim();
              if (!isEditing) {
                return (
                  <Pressable
                    key={block.id}
                    onPress={() => startEditingBlock(block.id, block.text.length)}
                    accessibilityRole="button"
                    accessibilityLabel="Edit this paragraph"
                  >
                    <MarkdownPreview text={block.text} style={styles.bodyInput} />
                  </Pressable>
                );
              }
              return (
                <TextInput
                  key={block.id}
                  ref={(el) => {
                    textInputRefs.current[block.id] = el;
                    if (pendingFocusBlockId.current === block.id && el) {
                      el.focus();
                      pendingFocusBlockId.current = null;
                    }
                  }}
                  value={block.text}
                  onChangeText={(text) => updateTextBlock(block.id, text)}
                  onFocus={() => handleBlockFocus(block.id)}
                  onBlur={handleBlockBlur}
                  onSelectionChange={(e) => {
                    selections.current[block.id] = e.nativeEvent.selection;
                  }}
                  selection={
                    pendingSelection?.blockId === block.id
                      ? { start: pendingSelection.pos, end: pendingSelection.pos }
                      : undefined
                  }
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
            if (block.type === "checklist") {
              return (
                <SwipeToDelete key={block.id} onDelete={() => removeBlock(block.id)}>
                  <View style={styles.checklistBlock}>
                    {block.items.map((item) => (
                      <View key={item.id} style={styles.checklistRow}>
                        <Pressable
                          onPress={() => toggleChecklistItem(block.id, item.id)}
                          style={[styles.checklistCheckbox, item.done && styles.checklistCheckboxDone]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: item.done }}
                          accessibilityLabel={item.text.trim() || "Checklist item"}
                        >
                          {item.done ? <Text style={styles.checklistCheckMark}>&#10003;</Text> : null}
                        </Pressable>
                        <TextInput
                          value={item.text}
                          onChangeText={(text) => updateChecklistItemText(block.id, item.id, text)}
                          onFocus={handleTypingFocus}
                          onBlur={handleTypingBlur}
                          onSubmitEditing={() => addChecklistItem(block.id, item.id)}
                          placeholder="A response or action step…"
                          placeholderTextColor={colors.textFaint}
                          style={[styles.checklistInput, item.done && styles.checklistInputDone]}
                          returnKeyType="next"
                          blurOnSubmit={false}
                        />
                        <Pressable
                          onPress={() => removeChecklistItem(block.id, item.id)}
                          hitSlop={8}
                          style={styles.checklistRemoveButton}
                          accessibilityRole="button"
                          accessibilityLabel="Remove this item"
                        >
                          <CloseIcon size={12} color={colors.textFaint} />
                        </Pressable>
                      </View>
                    ))}
                    <Pressable
                      onPress={() => addChecklistItem(block.id)}
                      style={styles.checklistAddRow}
                      accessibilityRole="button"
                      accessibilityLabel="Add a checklist item"
                    >
                      <Text style={styles.checklistAddText}>+ Add item</Text>
                    </Pressable>
                  </View>
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
                    transcript={block.transcript}
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
                    <TextInput
                      value={block.caption ?? ""}
                      onChangeText={(caption) => updateImageCaption(block.id, caption)}
                      onFocus={handleTypingFocus}
                      onBlur={handleTypingBlur}
                      placeholder="Add a caption (optional)"
                      placeholderTextColor={colors.textFaint}
                      style={styles.imageCaptionText}
                    />
                  </View>
                </View>
              </SwipeToDelete>
            );
          })}
        </ScrollView>

        {recording ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingBarTop}>
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
            {liveCaption ? (
              <Text style={styles.liveCaption} numberOfLines={2}>
                {liveCaption}
              </Text>
            ) : null}
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
            <View style={{ flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.toolbarScroll}
                scrollEventThrottle={16}
                onLayout={(e) => {
                  toolbarContainerWidth.current = e.nativeEvent.layout.width;
                  updateToolbarOverflow();
                }}
                onContentSizeChange={(w) => {
                  toolbarContentWidth.current = w;
                  updateToolbarOverflow();
                }}
                onScroll={(e) => {
                  const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
                  const atEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 4;
                  setToolbarOverflow(!atEnd && contentSize.width > layoutMeasurement.width);
                }}
              >
                {/* Ordered by how often each is reached for while actively taking
                    notes — the content-adding buttons first, since on a narrow
                    phone the row scrolls and these are the ones worth seeing
                    without having to discover that it scrolls at all. Undo/Redo
                    are reached for only after a mistake, so they're fine at the
                    end. */}
                <Pressable
                  style={[
                    styles.toolbarButton,
                    recording && styles.toolbarButtonRecording,
                    !!dictatingBlockId && styles.toolbarButtonDisabled,
                  ]}
                  onPress={toggleRecording}
                  disabled={!!dictatingBlockId}
                  accessibilityRole="button"
                  accessibilityLabel={recording ? "Stop recording" : "Record audio"}
                >
                  <MicIcon size={17} color={recording ? colors.white : colors.textSecondary} />
                  <Text style={[styles.toolbarButtonLabel, recording && styles.toolbarButtonLabelRecording]}>
                    {recording ? "Stop" : "Record"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.toolbarButton}
                  onPress={addPhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Add a photo"
                >
                  <CameraIcon size={17} />
                  <Text style={styles.toolbarButtonLabel}>Photo</Text>
                </Pressable>
                <Pressable
                  style={styles.toolbarButton}
                  onPress={addHeading}
                  accessibilityRole="button"
                  accessibilityLabel="Add a subheading"
                >
                  <HeadingIcon size={17} />
                  <Text style={styles.toolbarButtonLabel}>Heading</Text>
                </Pressable>
                <Pressable
                  style={styles.toolbarButton}
                  onPress={addChecklist}
                  accessibilityRole="button"
                  accessibilityLabel="Add a response checklist"
                >
                  <ChecklistIcon size={17} />
                  <Text style={styles.toolbarButtonLabel}>Checklist</Text>
                </Pressable>
                <Pressable
                  style={[styles.toolbarButton, verseBarOpen && styles.toolbarButtonActive]}
                  onPress={() => setVerseBarOpen((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel="Insert a Bible verse"
                >
                  <OpenBookIcon size={17} color={verseBarOpen ? colors.verseText : colors.textSecondary} />
                  <Text style={[styles.toolbarButtonLabel, verseBarOpen && styles.toolbarButtonLabelActive]}>
                    Verse
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toolbarButton, tagBarOpen && styles.toolbarButtonActive]}
                  onPress={() => setTagBarOpen((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel="Tags"
                >
                  <TagIcon size={17} color={tagBarOpen ? colors.verseText : colors.textSecondary} />
                  <Text style={[styles.toolbarButtonLabel, tagBarOpen && styles.toolbarButtonLabelActive]}>Tags</Text>
                </Pressable>
                <Pressable
                  style={[styles.toolbarButton, !canUndo && styles.toolbarButtonDisabled]}
                  onPress={undo}
                  disabled={!canUndo}
                  accessibilityRole="button"
                  accessibilityLabel="Undo"
                >
                  <UndoIcon size={17} color={canUndo ? colors.textSecondary : colors.textFaint} />
                  <Text style={[styles.toolbarButtonLabel, !canUndo && styles.toolbarButtonLabelDisabled]}>Undo</Text>
                </Pressable>
                <Pressable
                  style={[styles.toolbarButton, !canRedo && styles.toolbarButtonDisabled]}
                  onPress={redo}
                  disabled={!canRedo}
                  accessibilityRole="button"
                  accessibilityLabel="Redo"
                >
                  <RedoIcon size={17} color={canRedo ? colors.textSecondary : colors.textFaint} />
                  <Text style={[styles.toolbarButtonLabel, !canRedo && styles.toolbarButtonLabelDisabled]}>Redo</Text>
                </Pressable>
              </ScrollView>
              {/* A quiet hint that there are more tools to the right — without
                  it, Heading/Checklist/Verse/Tags/Undo/Redo can scroll fully
                  off-screen on a narrow phone with nothing suggesting they're
                  reachable at all. Only shown while there's actually more to
                  scroll to. */}
              {toolbarOverflow ? (
                <View style={styles.toolbarFade} pointerEvents="none">
                  <ChevronRightIcon size={13} color={colors.textFaint} />
                </View>
              ) : null}
            </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  formatButtons: { flexDirection: "row", gap: 8 },
  formatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F2EA",
    alignItems: "center",
    justifyContent: "center",
  },
  formatButtonText: { fontFamily: fontFamily.sansBold, fontSize: 15, color: colors.textSecondary },
  formatButtonTextBold: { fontFamily: fontFamily.sansExtraBold, fontSize: 14, color: colors.textPrimary },
  formatButtonTextItalic: { fontFamily: fontFamily.serifItalic, fontSize: 15, color: colors.textPrimary },
  formatButtonActive: { backgroundColor: colors.navy },
  formatButtonDisabled: { opacity: 0.4 },
  dictatingLabel: { fontFamily: fontFamily.sansBold, fontSize: 11.5, color: colors.gold, marginRight: 6 },
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
  scriptureRow: { gap: 8 },
  scriptureLabel: {
    fontFamily: fontFamily.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  scriptureChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 30,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.card,
  },
  scriptureChipText: { fontFamily: fontFamily.sansBold, fontSize: 12, color: colors.textPrimary },
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
  checklistBlock: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  checklistRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checklistCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistCheckboxDone: { backgroundColor: colors.navy, borderColor: colors.navy },
  checklistCheckMark: { color: colors.white, fontFamily: fontFamily.sansExtraBold, fontSize: 12 },
  checklistInput: { flex: 1, fontFamily: fontFamily.sansRegular, fontSize: 14.5, color: colors.textPrimary, paddingVertical: 6 },
  checklistInputDone: { color: colors.textFaint, textDecorationLine: "line-through" },
  checklistRemoveButton: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  checklistAddRow: { paddingVertical: 8, paddingLeft: 32 },
  checklistAddText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.gold },
  colorPickerRow: { marginTop: 8, paddingHorizontal: 2 },
  imageBlock: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  image: { width: "100%", height: 180, backgroundColor: "#EFE7D8" },
  imageCaption: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  imageCaptionText: { flex: 1, fontFamily: fontFamily.sansMedium, fontSize: 12.5, color: colors.textSecondary, padding: 0 },

  recordingBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  recordingBarTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B5E" },
  recordingText: { flex: 1, fontFamily: fontFamily.sansBold, fontSize: 13, color: colors.white },
  liveCaption: { fontFamily: fontFamily.sansMedium, fontSize: 12.5, color: "#C9D4E3", fontStyle: "italic" },
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
  toolbarScroll: { flexDirection: "row", alignItems: "center", gap: 10 },
  toolbarFade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    opacity: 0.9,
  },
  toolbarButton: {
    width: 58,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F5F2EA",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    flexShrink: 0,
  },
  toolbarButtonLabel: { fontFamily: fontFamily.sansSemibold, fontSize: 9.5, color: colors.textSecondary },
  toolbarButtonLabelActive: { color: colors.verseText },
  toolbarButtonLabelRecording: { color: colors.white },
  toolbarButtonLabelDisabled: { color: colors.textFaint },
  toolbarButtonActive: { backgroundColor: colors.verseBg },
  toolbarButtonRecording: { backgroundColor: "#FF6B5E" },
  toolbarButtonDisabled: { opacity: 0.4 },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  savedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  savedText: { fontFamily: fontFamily.sansMedium, fontSize: 11.5, color: colors.textMuted },
  });
}
