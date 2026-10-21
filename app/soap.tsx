import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows } from "@/theme/tokens";
import {
  ChecklistIcon,
  ChevronLeftIcon,
  OpenBookIcon,
  ShareArrowIcon,
} from "@/components/icons";
import { PressableScale } from "@/components/Motion";
import { getVerseOfTheDay } from "@/data/verseOfTheDay";
import { getDevotional, resolvePassage } from "@/data/devotionals";
import { notesStore } from "@/data/notesStore";
import { firstVerseBlock, newId, NoteBlock, SermonNote } from "@/types/note";
import { useToast } from "@/context/ToastContext";
import { useAlert } from "@/context/AlertContext";

const SOAP_DRAFT_KEY = "amani.soap.draft.v1";

/**
 * Modern, distraction-free SOAP Journal.
 *
 * S - Scripture: Read and record God's Word
 * O - Observation: Discover what the passage says
 * A - Application: Apply God's truth to daily life & define an action step
 * P - Prayer: Respond directly in prayer
 *
 * 100% offline, durable on-device storage, synced with notesStore.
 */
export default function SoapJournalScreen() {
  const { devotionalId, initialVerse, initialTitle, noteId } = useLocalSearchParams<{
    devotionalId?: string;
    initialVerse?: string;
    initialTitle?: string;
    noteId?: string;
  }>();

  const colors = useColors();
  const shadows = useShadows();
  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);
  const showToast = useToast();
  const showAlert = useAlert();

  const [activeNoteId] = useState<string>(() => noteId || newId());
  const [title, setTitle] = useState<string>(initialTitle || "");
  const [reference, setReference] = useState<string>(initialVerse || "");
  const [scriptureText, setScriptureText] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const [application, setApplication] = useState<string>("");
  const [actionStep, setActionStep] = useState<string>("");
  const [prayer, setPrayer] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadedExisting, setLoadedExisting] = useState(false);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // If loading an existing note
  useEffect(() => {
    if (!noteId) return;
    notesStore.getById(noteId).then((existing) => {
      if (!existing) return;
      setTitle(existing.title || "");
      let currentSection: "s" | "o" | "a" | "p" | null = null;
      let sRef = "";
      let sText = "";
      let oText = "";
      let aText = "";
      let aStep = "";
      let pText = "";

      for (const block of existing.blocks || []) {
        if (block.type === "heading") {
          const h = block.text.toLowerCase().trim();
          if (h.includes("scripture")) currentSection = "s";
          else if (h.includes("observation")) currentSection = "o";
          else if (h.includes("application")) currentSection = "a";
          else if (h.includes("prayer")) currentSection = "p";
          continue;
        }
        if (currentSection === "s") {
          if (block.type === "verse") {
            sRef = block.reference;
            sText = block.text;
          } else if (block.type === "text" || block.type === "quote") {
            sText = (sText ? `${sText}\n` : "") + block.text;
          }
        } else if (currentSection === "o" && block.type === "text") {
          oText = (oText ? `${oText}\n` : "") + block.text;
        } else if (currentSection === "a") {
          if (block.type === "text") aText = (aText ? `${aText}\n` : "") + block.text;
          else if (block.type === "checklist" && block.items.length > 0) {
            aStep = block.items[0].text;
          }
        } else if (currentSection === "p" && block.type === "text") {
          pText = (pText ? `${pText}\n` : "") + block.text;
        }
      }

      const foundVerse = firstVerseBlock(existing);
      setReference(sRef || foundVerse?.reference || "");
      setScriptureText(sText || foundVerse?.text || "");
      setObservation(oText);
      setApplication(aText);
      setActionStep(aStep);
      setPrayer(pText);
      setLoadedExisting(true);
    });
  }, [noteId]);

  // If from devotional param, prefill first passage
  useEffect(() => {
    if (devotionalId && !initialVerse) {
      const dev = getDevotional(devotionalId);
      if (dev && dev.passages.length > 0) {
        const first = dev.passages[0];
        setReference(first.reference);
        const resolved = resolvePassage(first);
        if (resolved.text) setScriptureText(resolved.text);
      }
    }
  }, [devotionalId, initialVerse]);

  // Auto-resolve reference when reference changes if text is empty
  const lookupScripture = useCallback((ref: string) => {
    if (!ref.trim()) return;
    const resolved = resolvePassage({ reference: ref.trim(), insight: "" });
    if (resolved.text) {
      setScriptureText(resolved.text);
    }
  }, []);

  // When initialVerse was provided, resolve its text
  useEffect(() => {
    if (initialVerse && !scriptureText) {
      lookupScripture(initialVerse);
    }
  }, [initialVerse, lookupScripture, scriptureText]);

  // Insert Today's Verse with 1 tap
  function insertVerseOfTheDay() {
    const votd = getVerseOfTheDay();
    if (!votd) {
      showToast("No verse of the day available");
      return;
    }
    setReference(votd.reference);
    setScriptureText(votd.text);
    showToast("Inserted Today's Verse");
  }

  // Restore draft if fresh note
  useEffect(() => {
    if (noteId || devotionalId || initialVerse) return;
    AsyncStorage.getItem(SOAP_DRAFT_KEY).then((raw) => {
      if (!raw) return;
      try {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === "object") {
          if (draft.reference) setReference(draft.reference);
          if (draft.scriptureText) setScriptureText(draft.scriptureText);
          if (draft.observation) setObservation(draft.observation);
          if (draft.application) setApplication(draft.application);
          if (draft.actionStep) setActionStep(draft.actionStep);
          if (draft.prayer) setPrayer(draft.prayer);
          if (draft.title) setTitle(draft.title);
        }
      } catch {
        // Ignore unparseable draft
      }
    });
  }, [noteId, devotionalId, initialVerse]);

  // Debounced auto-save draft
  const draftTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (loadedExisting) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      const hasContent =
        reference.trim() ||
        observation.trim() ||
        application.trim() ||
        prayer.trim();
      if (!hasContent) return;
      AsyncStorage.setItem(
        SOAP_DRAFT_KEY,
        JSON.stringify({
          title,
          reference,
          scriptureText,
          observation,
          application,
          actionStep,
          prayer,
          updatedAt: new Date().toISOString(),
        })
      ).catch(() => {});
    }, 600);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [title, reference, scriptureText, observation, application, actionStep, prayer, loadedExisting]);

  // Save to Notes
  async function handleSave() {
    const hasAnyContent =
      reference.trim() ||
      scriptureText.trim() ||
      observation.trim() ||
      application.trim() ||
      prayer.trim();

    if (!hasAnyContent) {
      showAlert({
        title: "Empty Journal",
        message: "Please write at least your scripture passage or observation before saving.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const blocks: NoteBlock[] = [
        { id: newId(), type: "heading", text: "Scripture" },
      ];

      if (reference.trim()) {
        blocks.push({
          id: newId(),
          type: "verse",
          reference: reference.trim(),
          text: scriptureText.trim(),
        });
      } else if (scriptureText.trim()) {
        blocks.push({
          id: newId(),
          type: "quote",
          text: scriptureText.trim(),
        });
      }

      blocks.push({ id: newId(), type: "heading", text: "Observation" });
      blocks.push({
        id: newId(),
        type: "text",
        text: observation.trim() || "(No observation recorded)",
      });

      blocks.push({ id: newId(), type: "heading", text: "Application" });
      blocks.push({
        id: newId(),
        type: "text",
        text: application.trim() || "(No application recorded)",
      });

      if (actionStep.trim()) {
        blocks.push({
          id: newId(),
          type: "checklist",
          items: [{ id: newId(), text: actionStep.trim(), done: false }],
        });
      }

      blocks.push({ id: newId(), type: "heading", text: "Prayer" });
      blocks.push({
        id: newId(),
        type: "text",
        text: prayer.trim() || "(No prayer recorded)",
      });

      const finalTitle =
        title.trim() ||
        (reference.trim() ? `SOAP: ${reference.trim()}` : `SOAP Journal · ${todayFormatted}`);

      const noteToSave: SermonNote = {
        id: activeNoteId,
        title: finalTitle,
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        series: "SOAP Journal",
        tags: ["soap", "quiet-time", ...(devotionalId ? ["devotional"] : [])],
        blocks,
      };

      await notesStore.save(noteToSave);
      await AsyncStorage.removeItem(SOAP_DRAFT_KEY).catch(() => {});
      showToast("Saved to Notes");
      router.back();
    } catch (err) {
      showAlert({ title: "Could not save journal", message: String(err) });
    } finally {
      setIsSaving(false);
    }
  }

  // Copy plain text
  async function handleCopy() {
    const textPieces = [
      `SOAP Journal — ${title || reference || todayFormatted}`,
      `Date: ${todayFormatted}`,
      "",
      `[S] SCRIPTURE: ${reference}`,
      scriptureText ? `"${scriptureText}"` : "",
      "",
      "[O] OBSERVATION:",
      observation || "(None)",
      "",
      "[A] APPLICATION:",
      application || "(None)",
      actionStep ? `Action Step: [ ] ${actionStep}` : "",
      "",
      "[P] PRAYER:",
      prayer || "(None)",
    ]
      .filter((line) => line !== null)
      .join("\n");

    await Clipboard.setStringAsync(textPieces);
    showToast("Copied SOAP entry to clipboard");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>SOAP Journal</Text>
          <Text style={styles.headerSubtitle}>{todayFormatted}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleCopy}
            style={styles.headerButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Copy journal text"
          >
            <ShareArrowIcon size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={styles.savePill}
            accessibilityRole="button"
            accessibilityLabel="Save journal"
          >
            <Text style={styles.savePillText}>{isSaving ? "Saving..." : "Save"}</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Optional Title */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Journal Title (optional)"
            placeholderTextColor={colors.textFaint}
            style={styles.titleInput}
          />

          {/* S - SCRIPTURE CARD */}
          <View style={styles.soapCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: colors.navy }]}>
                <Text style={styles.badgeLetter}>S</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Scripture</Text>
                <Text style={styles.cardPrompt}>What passage are you reading today?</Text>
              </View>
              <Pressable
                onPress={insertVerseOfTheDay}
                style={styles.helperPill}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Insert Today's Verse"
              >
                <OpenBookIcon size={12} color={colors.verseText} />
                <Text style={styles.helperPillText}>Today&apos;s Verse</Text>
              </Pressable>
            </View>

            <View style={styles.refRow}>
              <TextInput
                value={reference}
                onChangeText={(text) => {
                  setReference(text);
                  lookupScripture(text);
                }}
                placeholder="e.g. Philippians 4:6-7"
                placeholderTextColor={colors.textFaint}
                style={styles.refInput}
                autoCorrect={false}
              />
            </View>

            <TextInput
              value={scriptureText}
              onChangeText={setScriptureText}
              placeholder="Scripture passage text (resolves automatically from offline Bible, or write your own)..."
              placeholderTextColor={colors.textFaint}
              multiline
              style={styles.passageInput}
            />
          </View>

          {/* O - OBSERVATION CARD */}
          <View style={styles.soapCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: "#8A5A36" }]}>
                <Text style={styles.badgeLetter}>O</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Observation</Text>
                <Text style={styles.cardPrompt}>
                  What stands out? What truth is revealed about God or human nature?
                </Text>
              </View>
            </View>
            <TextInput
              value={observation}
              onChangeText={setObservation}
              placeholder="Write your observations, questions, and insights here..."
              placeholderTextColor={colors.textFaint}
              multiline
              style={styles.bodyInput}
            />
          </View>

          {/* A - APPLICATION CARD */}
          <View style={styles.soapCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: "#2A6F55" }]}>
                <Text style={styles.badgeLetter}>A</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Application</Text>
                <Text style={styles.cardPrompt}>
                  How does this apply to your life? What personal change is God asking of you?
                </Text>
              </View>
            </View>
            <TextInput
              value={application}
              onChangeText={setApplication}
              placeholder="How will you live differently today because of this truth?..."
              placeholderTextColor={colors.textFaint}
              multiline
              style={styles.bodyInput}
            />

            {/* Action step row */}
            <View style={styles.actionStepContainer}>
              <View style={styles.actionStepHeader}>
                <ChecklistIcon size={14} color={colors.navy} />
                <Text style={styles.actionStepLabel}>One concrete action step for today:</Text>
              </View>
              <TextInput
                value={actionStep}
                onChangeText={setActionStep}
                placeholder="e.g. Call my friend to encourage them, pray before meetings..."
                placeholderTextColor={colors.textFaint}
                style={styles.actionStepInput}
              />
            </View>
          </View>

          {/* P - PRAYER CARD */}
          <View style={styles.soapCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: "#5D4078" }]}>
                <Text style={styles.badgeLetter}>P</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Prayer</Text>
                <Text style={styles.cardPrompt}>
                  Respond to God in prayer. Ask for His grace and power to live out His Word.
                </Text>
              </View>
            </View>
            <TextInput
              value={prayer}
              onChangeText={setPrayer}
              placeholder="Heavenly Father, thank You for Your Word today..."
              placeholderTextColor={colors.textFaint}
              multiline
              style={styles.bodyInput}
            />
          </View>

          {/* Bottom Save Bar */}
          <PressableScale
            onPress={handleSave}
            disabled={isSaving}
            style={styles.bottomSaveButton}
          >
            <Text style={styles.bottomSaveText}>{isSaving ? "Saving..." : "Save to Notes"}</Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette, shadows: Shadows) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 8,
      maxWidth: 720,
      width: "100%",
      alignSelf: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.md,
    },
    headerTitleWrap: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      fontFamily: fontFamily.serifBold,
      fontSize: 16,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    savePill: {
      backgroundColor: colors.navy,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: radius.pill,
    },
    savePillText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 12,
      color: colors.white,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 48,
      maxWidth: 720,
      width: "100%",
      alignSelf: "center",
      gap: 16,
    },
    titleInput: {
      fontFamily: fontFamily.serifBold,
      fontSize: 20,
      color: colors.textPrimary,
      paddingVertical: 6,
      paddingHorizontal: 2,
    },
    soapCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: 16,
      gap: 12,
      ...shadows.sm,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    badge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    badgeLetter: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 15,
      color: colors.white,
    },
    cardTitle: {
      fontFamily: fontFamily.serifBold,
      fontSize: 16,
      color: colors.textPrimary,
    },
    cardPrompt: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      lineHeight: 16,
    },
    helperPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.verseBg,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    helperPillText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 10.5,
      color: colors.verseText,
    },
    refRow: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    refInput: {
      fontFamily: fontFamily.sansBold,
      fontSize: 14,
      color: colors.textPrimary,
      padding: 0,
    },
    passageInput: {
      fontFamily: fontFamily.serifRegular,
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 12,
      minHeight: 80,
      textAlignVertical: "top",
    },
    bodyInput: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 14,
      lineHeight: 22,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 12,
      minHeight: 110,
      textAlignVertical: "top",
    },
    actionStepContainer: {
      backgroundColor: colors.verseBg,
      borderRadius: radius.md,
      padding: 12,
      gap: 8,
      marginTop: 2,
    },
    actionStepHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    actionStepLabel: {
      fontFamily: fontFamily.sansBold,
      fontSize: 11.5,
      color: colors.navy,
    },
    actionStepInput: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    bottomSaveButton: {
      backgroundColor: colors.navy,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      ...shadows.sm,
    },
    bottomSaveText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 14,
      color: colors.white,
    },
  });
}
