import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows, spacing } from "@/theme/tokens";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  IconProps,
  LockIcon,
  NotesIcon,
  OpenBookIcon,
  PauseIcon,
  PlayIcon,
  SpeakerIcon,
} from "./icons";
import { PressableScale } from "./Motion";

const DISCOVER_DISMISSED_KEY = "amani.discoverVideo.dismissed.v1";

/** Isolated hook for the Home screen's dismissible "Discover Amani" video card.
 * Never touches notes or user data keys. */
export function useDiscoverVideo() {
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(DISCOVER_DISMISSED_KEY)
      .then((val) => {
        if (!mounted) return;
        setDismissed(val === "true");
        setLoaded(true);
      })
      .catch(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    AsyncStorage.setItem(DISCOVER_DISMISSED_KEY, "true").catch(() => {});
  }, []);

  const restore = useCallback(() => {
    setDismissed(false);
    AsyncStorage.removeItem(DISCOVER_DISMISSED_KEY).catch(() => {});
  }, []);

  return { visible: loaded && !dismissed, dismiss, restore };
}

interface VideoScene {
  id: string;
  chapter: string;
  title: string;
  caption: string;
  highlights: string[];
  icon: (props: IconProps) => React.ReactNode;
}

const SCENE_DURATION_MS = 9000; // 9s per scene -> 36s total reel

const SCENES: VideoScene[] = [
  {
    id: "sanctuary",
    chapter: "01 · THE SANCTUARY EXPERIENCE",
    title: "Calm, distraction-free sermon notes & Scripture",
    caption:
      "Amani is designed specifically for church services and quiet study — working 100% offline from the moment you open it.",
    highlights: ["100% Offline Ready", "Zero Ads or Distractions", "Warm Reading Themes"],
    icon: (p) => <OpenBookIcon {...p} />,
  },
  {
    id: "capture",
    chapter: "02 · CAPTURE EVERY INSIGHT",
    title: "Write, record voice clips, and link verses automatically",
    caption:
      "Type any Scripture reference like John 3:16 and Amani turns it into a tappable verse chip. Insert callouts, checklists, photos, and live audio.",
    highlights: ["Auto-Detected Verses", "Voice + Live Captions", "Slide Photos & Checklists"],
    icon: (p) => <NotesIcon {...p} />,
  },
  {
    id: "bibles",
    chapter: "03 · DEEP SCRIPTURE STUDY",
    title: "Five classic Bibles & 340,000+ cross-references",
    caption:
      "Switch effortlessly between KJV, WEB, ASV, Darby, and YLT. Highlight verses, follow reading plans, and explore cross-references offline.",
    highlights: ["KJV · WEB · ASV · Darby · YLT", "Verse Highlights & Bookmarks", "Cross-Reference Explorer"],
    icon: (p) => <OpenBookIcon {...p} />,
  },
  {
    id: "privacy",
    chapter: "04 · YOURS ALONE, FOREVER SAFE",
    title: "Private on your device with built-in data protection",
    caption:
      "No account or cloud sign-up required. Your notes are protected by automatic local recovery backups, optional PIN lock, and Amani Link transfers.",
    highlights: ["Auto-Recovery Protection", "Optional App PIN Lock", "Amani Link Device Sync"],
    icon: (p) => <LockIcon {...p} />,
  },
];

function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
}

/**
 * Clean, minimal Home screen card that launches the 36-second overview tour.
 */
export function DiscoverAmaniCard({
  onWatch,
  onDismiss,
}: {
  onWatch: () => void;
  onDismiss?: () => void;
}) {
  const colors = useColors();
  const shadows = useShadows();
  const styles = useMemo(() => makeCardStyles(colors, shadows), [colors, shadows]);

  return (
    <View style={styles.card}>
      <PressableScale
        style={styles.innerRow}
        onPress={onWatch}
        accessibilityRole="button"
        accessibilityLabel="Watch the 36-second Amani overview video"
      >
        <View style={styles.playBadge}>
          <PlayIcon size={16} color={colors.navy} />
        </View>

        <View style={styles.copyCol}>
          <Text style={styles.title}>How Amani works · 0:36</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            A quick overview of sermon notes, auto-linked verses, and offline Bibles.
          </Text>
        </View>
      </PressableScale>

      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss video card"
        >
          <CloseIcon size={14} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Clean, minimalist 36-second walkthrough player modal matching Amani's
 * calm typography and simple line-icon design language.
 */
export function AmaniVideoModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeModalStyles(colors), [colors]);

  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [narrationOn, setNarrationOn] = useState(false);
  const [elapsedInScene, setElapsedInScene] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const scene = SCENES[sceneIndex] ?? SCENES[0];
  const totalDurationSec = (SCENES.length * SCENE_DURATION_MS) / 1000;
  const currentOverallSec = (sceneIndex * SCENE_DURATION_MS + elapsedInScene) / 1000;

  const stopSpeech = useCallback(() => {
    try {
      Speech.stop();
    } catch {
      // ignore on unsupported environments
    }
  }, []);

  const speakCurrentScene = useCallback(
    (idx: number, enabled: boolean) => {
      stopSpeech();
      if (!enabled) return;
      const target = SCENES[idx];
      if (!target) return;
      try {
        Speech.speak(`${target.title}. ${target.caption}`, {
          rate: 0.98,
        });
      } catch {
        // ignore if speech synthesis is unavailable
      }
    },
    [stopSpeech]
  );

  useEffect(() => {
    if (visible) {
      setSceneIndex(0);
      setElapsedInScene(0);
      setPlaying(true);
      progressAnim.setValue(0);
    } else {
      stopSpeech();
    }
  }, [visible, progressAnim, stopSpeech]);

  useEffect(() => {
    if (!visible) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (playing && narrationOn) {
      speakCurrentScene(sceneIndex, true);
    }
  }, [sceneIndex, visible, fadeAnim, playing, narrationOn, speakCurrentScene]);

  useEffect(() => {
    if (!visible || !playing) return;
    const stepMs = 100;
    const timer = setInterval(() => {
      setElapsedInScene((prev) => {
        const next = prev + stepMs;
        const ratio = Math.min(1, next / SCENE_DURATION_MS);
        progressAnim.setValue(ratio);
        if (next >= SCENE_DURATION_MS) {
          if (sceneIndex < SCENES.length - 1) {
            setSceneIndex((s) => s + 1);
            progressAnim.setValue(0);
            return 0;
          } else {
            setPlaying(false);
            return SCENE_DURATION_MS;
          }
        }
        return next;
      });
    }, stepMs);
    return () => clearInterval(timer);
  }, [visible, playing, sceneIndex, progressAnim]);

  function jumpToScene(idx: number) {
    const clamped = Math.max(0, Math.min(SCENES.length - 1, idx));
    setSceneIndex(clamped);
    setElapsedInScene(0);
    progressAnim.setValue(0);
    setPlaying(true);
  }

  function togglePlay() {
    if (!playing && sceneIndex === SCENES.length - 1 && elapsedInScene >= SCENE_DURATION_MS) {
      setSceneIndex(0);
      setElapsedInScene(0);
      progressAnim.setValue(0);
      setPlaying(true);
      return;
    }
    const nextPlaying = !playing;
    setPlaying(nextPlaying);
    if (!nextPlaying) {
      stopSpeech();
    } else if (narrationOn) {
      speakCurrentScene(sceneIndex, true);
    }
  }

  function toggleNarration() {
    const next = !narrationOn;
    setNarrationOn(next);
    if (next && playing) {
      speakCurrentScene(sceneIndex, true);
    } else {
      stopSpeech();
    }
  }

  function handleClose() {
    stopSpeech();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.scrim}>
        <View style={styles.playerCard} accessibilityViewIsModal>
          {/* Segmented Timeline Bar */}
          <View style={styles.segmentsRow}>
            {SCENES.map((s, idx) => {
              const isPast = idx < sceneIndex;
              const isCurrent = idx === sceneIndex;
              return (
                <Pressable
                  key={s.id}
                  style={styles.segmentTrack}
                  onPress={() => jumpToScene(idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`Jump to scene ${idx + 1}: ${s.title}`}
                >
                  {isPast ? (
                    <View style={[styles.segmentFill, { width: "100%" }]} />
                  ) : isCurrent ? (
                    <Animated.View
                      style={[
                        styles.segmentFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                        },
                      ]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.chapterLabel}>{scene.chapter}</Text>

            <View style={styles.topActions}>
              <Pressable
                onPress={toggleNarration}
                style={[styles.narrationBtn, narrationOn && styles.narrationBtnActive]}
                accessibilityRole="button"
                accessibilityLabel={narrationOn ? "Mute voiceover narration" : "Enable voiceover narration"}
              >
                <SpeakerIcon size={13} color={narrationOn ? colors.white : colors.textSecondary} />
                <Text style={[styles.narrationBtnText, narrationOn && styles.narrationBtnTextActive]}>
                  {narrationOn ? "Voice On" : "Voice"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleClose}
                hitSlop={10}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close video"
              >
                <CloseIcon size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Clean Minimal Stage */}
          <Animated.View style={[styles.stage, { opacity: fadeAnim }]}>
            <View style={styles.iconWrap}>{scene.icon({ size: 28, color: colors.gold })}</View>

            <Text style={styles.sceneTitle}>{scene.title}</Text>
            <Text style={styles.sceneCaption}>{scene.caption}</Text>

            <View style={styles.highlightsRow}>
              {scene.highlights.map((chip) => (
                <View key={chip} style={styles.highlightChip}>
                  <Text style={styles.highlightChipText}>{chip}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Transport Controls */}
          <View style={styles.controlsBar}>
            <Text style={styles.timecode}>
              {formatSeconds(currentOverallSec)} / {formatSeconds(totalDurationSec)}
            </Text>

            <View style={styles.transportGroup}>
              <Pressable
                onPress={() => jumpToScene(sceneIndex - 1)}
                disabled={sceneIndex === 0}
                style={[styles.skipBtn, sceneIndex === 0 && { opacity: 0.35 }]}
                accessibilityRole="button"
                accessibilityLabel="Previous scene"
              >
                <ChevronLeftIcon size={17} color={colors.textPrimary} />
              </Pressable>

              <Pressable
                onPress={togglePlay}
                style={styles.playPauseBtn}
                accessibilityRole="button"
                accessibilityLabel={playing ? "Pause video" : "Play video"}
              >
                {playing ? (
                  <PauseIcon size={16} color={colors.white} />
                ) : (
                  <PlayIcon size={16} color={colors.white} />
                )}
              </Pressable>

              <Pressable
                onPress={() => jumpToScene(sceneIndex + 1)}
                disabled={sceneIndex === SCENES.length - 1}
                style={[styles.skipBtn, sceneIndex === SCENES.length - 1 && { opacity: 0.35 }]}
                accessibilityRole="button"
                accessibilityLabel="Next scene"
              >
                <ChevronRightIcon size={17} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Pressable
              onPress={handleClose}
              style={styles.donePill}
              accessibilityRole="button"
              accessibilityLabel="Done watching"
            >
              <Text style={styles.donePillText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeCardStyles(colors: ColorPalette, shadows: Shadows) {
  return StyleSheet.create({
    card: {
      position: "relative",
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      ...shadows.sm,
    },
    innerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    playBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    copyCol: {
      flex: 1,
      paddingRight: 20,
    },
    title: {
      fontFamily: fontFamily.serifSemibold,
      fontSize: 15,
      color: colors.textPrimary,
    },
    subtitle: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.textSecondary,
      marginTop: 2,
    },
    dismissButton: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

function makeModalStyles(colors: ColorPalette) {
  return StyleSheet.create({
    scrim: {
      flex: 1,
      backgroundColor: colors.scrim,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    playerCard: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
    },
    segmentsRow: {
      flexDirection: "row",
      gap: 6,
      marginBottom: 14,
    },
    segmentTrack: {
      flex: 1,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: colors.borderLight,
      overflow: "hidden",
    },
    segmentFill: {
      height: "100%",
      backgroundColor: colors.gold,
      borderRadius: 2,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    chapterLabel: {
      fontFamily: fontFamily.sansBold,
      fontSize: 10.5,
      letterSpacing: 0.8,
      color: colors.textMuted,
    },
    topActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    narrationBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
    },
    narrationBtnActive: {
      backgroundColor: colors.navy,
    },
    narrationBtnText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 11,
      color: colors.textSecondary,
    },
    narrationBtnTextActive: {
      color: colors.white,
    },
    closeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    stage: {
      alignItems: "center",
      paddingVertical: 18,
    },
    iconWrap: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    sceneTitle: {
      fontFamily: fontFamily.serifBold,
      fontSize: 19,
      lineHeight: 25,
      color: colors.textPrimary,
      textAlign: "center",
      marginTop: 16,
    },
    sceneCaption: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
    },
    highlightsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: 16,
    },
    highlightChip: {
      backgroundColor: colors.verseBg,
      borderWidth: 1,
      borderColor: colors.verseBorder,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    highlightChipText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 11,
      color: colors.verseText,
    },
    controlsBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    timecode: {
      fontFamily: fontFamily.sansBold,
      fontSize: 11.5,
      color: colors.textMuted,
      minWidth: 64,
    },
    transportGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    skipBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    playPauseBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    donePill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
    },
    donePillText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 12,
      color: colors.textPrimary,
    },
  });
}
