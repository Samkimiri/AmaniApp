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
  PauseIcon,
  PlayIcon,
  SpeakerIcon,
} from "./icons";
import {
  SceneBibleTranslationsGraphic,
  SceneNoteBlocksGraphic,
  ScenePrivacyShieldGraphic,
  SceneSanctuaryGraphic,
  VideoPreviewArtwork,
} from "./Graphics";
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
  renderArtwork: () => React.ReactNode;
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
    renderArtwork: () => <SceneSanctuaryGraphic size={196} />,
  },
  {
    id: "capture",
    chapter: "02 · CAPTURE EVERY INSIGHT",
    title: "Write, record voice clips, and link verses automatically",
    caption:
      "Type any Scripture reference like John 3:16 and Amani turns it into a tappable verse chip. Insert callouts, checklists, photos, and live audio.",
    highlights: ["Auto-Detected Verses", "Voice + Live Captions", "Slide Photos & Checklists"],
    renderArtwork: () => <SceneNoteBlocksGraphic size={196} />,
  },
  {
    id: "bibles",
    chapter: "03 · DEEP SCRIPTURE STUDY",
    title: "Five classic Bibles & 340,000+ cross-references",
    caption:
      "Switch effortlessly between KJV, WEB, ASV, Darby, and YLT. Highlight verses, follow reading plans, and explore cross-references offline.",
    highlights: ["KJV · WEB · ASV · Darby · YLT", "Verse Highlights & Bookmarks", "Cross-Reference Explorer"],
    renderArtwork: () => <SceneBibleTranslationsGraphic size={196} />,
  },
  {
    id: "privacy",
    chapter: "04 · YOURS ALONE, FOREVER SAFE",
    title: "Private on your device with built-in data protection",
    caption:
      "No account or cloud sign-up required. Your notes are protected by automatic local recovery backups, optional PIN lock, and Amani Link transfers.",
    highlights: ["Auto-Recovery Protection", "Optional App PIN Lock", "Amani Link Device Sync"],
    renderArtwork: () => <ScenePrivacyShieldGraphic size={196} />,
  },
];

function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
}

/**
 * Dismissible Home screen feature card with a rich graphic thumbnail that
 * launches the 36-second interactive explainer video.
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
        <View style={styles.thumbWrap}>
          <VideoPreviewArtwork width={108} height={82} />
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>0:36</Text>
          </View>
        </View>

        <View style={styles.copyCol}>
          <View style={styles.eyebrowRow}>
            <View style={styles.liveDot} />
            <Text style={styles.eyebrow}>APP OVERVIEW VIDEO</Text>
          </View>
          <Text style={styles.title}>See what Amani can do</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Take a 36-second visual tour of sermon notes, auto-linked verses, and offline Bibles.
          </Text>
          <View style={styles.watchPill}>
            <PlayIcon size={11} color="#16283F" />
            <Text style={styles.watchPillText}>Watch short video</Text>
          </View>
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
          <CloseIcon size={15} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Full-featured, self-contained animated video player modal that explains Amani
 * in 4 visual chapters (~36 seconds total) with smooth 60fps transitions,
 * interactive timeline scrubbing, and optional spoken narration.
 */
export function AmaniVideoModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [narrationOn, setNarrationOn] = useState(false);
  const [elapsedInScene, setElapsedInScene] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
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

  // Reset when modal opens/closes
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

  // Subtle continuous floating animation for the artwork
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, floatAnim]);

  // Entrance fade on scene change + optional voiceover
  useEffect(() => {
    if (!visible) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (playing && narrationOn) {
      speakCurrentScene(sceneIndex, true);
    }
  }, [sceneIndex, visible, fadeAnim, playing, narrationOn, speakCurrentScene]);

  // Advance timer while playing
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
            // Reached the end of the reel
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
      // Replay from beginning if finished
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
      <View style={modalStyles.scrim}>
        <View style={modalStyles.playerCard} accessibilityViewIsModal>
          {/* Segmented Reel Timeline Bar */}
          <View style={modalStyles.segmentsRow}>
            {SCENES.map((s, idx) => {
              const isPast = idx < sceneIndex;
              const isCurrent = idx === sceneIndex;
              return (
                <Pressable
                  key={s.id}
                  style={modalStyles.segmentTrack}
                  onPress={() => jumpToScene(idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`Jump to scene ${idx + 1}: ${s.title}`}
                >
                  {isPast ? (
                    <View style={[modalStyles.segmentFill, { width: "100%" }]} />
                  ) : isCurrent ? (
                    <Animated.View
                      style={[
                        modalStyles.segmentFill,
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

          {/* Top Bar: Brand + Audio Narration Toggle + Close */}
          <View style={modalStyles.topBar}>
            <View style={modalStyles.brandBadge}>
              <View style={modalStyles.brandDot} />
              <Text style={modalStyles.brandBadgeText}>AMANI FEATURE REEL</Text>
            </View>

            <View style={modalStyles.topActions}>
              <Pressable
                onPress={toggleNarration}
                style={[
                  modalStyles.narrationBtn,
                  narrationOn && modalStyles.narrationBtnActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={narrationOn ? "Mute voiceover narration" : "Enable voiceover narration"}
              >
                <SpeakerIcon size={14} color={narrationOn ? "#16283F" : "#F0D68A"} />
                <Text
                  style={[
                    modalStyles.narrationBtnText,
                    narrationOn && modalStyles.narrationBtnTextActive,
                  ]}
                >
                  {narrationOn ? "Voice On" : "Voice Off"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleClose}
                hitSlop={10}
                style={modalStyles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close video"
              >
                <CloseIcon size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Animated Stage */}
          <Animated.View style={[modalStyles.stage, { opacity: fadeAnim }]}>
            <Animated.View style={[modalStyles.artworkStage, { transform: [{ translateY: floatAnim }] }]}>
              {scene.renderArtwork()}
            </Animated.View>

            <Text style={modalStyles.chapterLabel}>{scene.chapter}</Text>
            <Text style={modalStyles.sceneTitle}>{scene.title}</Text>
            <Text style={modalStyles.sceneCaption}>{scene.caption}</Text>

            <View style={modalStyles.highlightsRow}>
              {scene.highlights.map((chip) => (
                <View key={chip} style={modalStyles.highlightChip}>
                  <Text style={modalStyles.highlightChipText}>{chip}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Video Transport Controls */}
          <View style={modalStyles.controlsBar}>
            <Text style={modalStyles.timecode}>
              {formatSeconds(currentOverallSec)} / {formatSeconds(totalDurationSec)}
            </Text>

            <View style={modalStyles.transportGroup}>
              <Pressable
                onPress={() => jumpToScene(sceneIndex - 1)}
                disabled={sceneIndex === 0}
                style={[modalStyles.skipBtn, sceneIndex === 0 && { opacity: 0.35 }]}
                accessibilityRole="button"
                accessibilityLabel="Previous scene"
              >
                <ChevronLeftIcon size={18} color="#FFFFFF" />
              </Pressable>

              <Pressable
                onPress={togglePlay}
                style={modalStyles.playPauseBtn}
                accessibilityRole="button"
                accessibilityLabel={playing ? "Pause video" : "Play video"}
              >
                {playing ? (
                  <PauseIcon size={18} color="#16283F" />
                ) : (
                  <PlayIcon size={18} color="#16283F" />
                )}
              </Pressable>

              <Pressable
                onPress={() => jumpToScene(sceneIndex + 1)}
                disabled={sceneIndex === SCENES.length - 1}
                style={[
                  modalStyles.skipBtn,
                  sceneIndex === SCENES.length - 1 && { opacity: 0.35 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Next scene"
              >
                <ChevronRightIcon size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <Pressable
              onPress={handleClose}
              style={modalStyles.donePill}
              accessibilityRole="button"
              accessibilityLabel="Done watching"
            >
              <Text style={modalStyles.donePillText}>Done</Text>
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
      borderColor: colors.verseBorder,
      padding: 14,
      ...shadows.sm,
    },
    innerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    thumbWrap: {
      position: "relative",
      width: 108,
      height: 82,
      borderRadius: 12,
      overflow: "hidden",
    },
    durationBadge: {
      position: "absolute",
      bottom: 6,
      right: 6,
      backgroundColor: "rgba(22, 40, 63, 0.86)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: "rgba(240, 214, 138, 0.35)",
    },
    durationText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 10,
      color: "#F0D68A",
      letterSpacing: 0.4,
    },
    copyCol: {
      flex: 1,
      paddingRight: 18,
    },
    eyebrowRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.gold,
    },
    eyebrow: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 10,
      letterSpacing: 0.9,
      color: colors.gold,
    },
    title: {
      fontFamily: fontFamily.serifBold,
      fontSize: 16.5,
      color: colors.textPrimary,
      marginTop: 2,
    },
    subtitle: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 12.5,
      lineHeight: 17.5,
      color: colors.textSecondary,
      marginTop: 3,
    },
    watchPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 8,
      backgroundColor: "#F0D68A",
      paddingHorizontal: 10,
      paddingVertical: 4.5,
      borderRadius: radius.pill,
    },
    watchPillText: {
      fontFamily: fontFamily.sansBold,
      fontSize: 11.5,
      color: "#16283F",
    },
    dismissButton: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

const modalStyles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(10, 16, 26, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  playerCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#142234",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(240, 214, 138, 0.25)",
    padding: 20,
    overflow: "hidden",
  },
  segmentsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  segmentTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
  },
  segmentFill: {
    height: "100%",
    backgroundColor: "#F0D68A",
    borderRadius: 2,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#F0D68A",
  },
  brandBadgeText: {
    fontFamily: fontFamily.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 1,
    color: "#F0D68A",
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(240, 214, 138, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  narrationBtnActive: {
    backgroundColor: "#F0D68A",
    borderColor: "#F0D68A",
  },
  narrationBtnText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 11,
    color: "#F0D68A",
  },
  narrationBtnTextActive: {
    color: "#16283F",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    alignItems: "center",
    paddingVertical: 12,
  },
  artworkStage: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterLabel: {
    fontFamily: fontFamily.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: "#D9B75C",
    marginTop: 6,
    textAlign: "center",
  },
  sceneTitle: {
    fontFamily: fontFamily.serifBold,
    fontSize: 21,
    lineHeight: 27,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 6,
  },
  sceneCaption: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#B8C4D4",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 6,
  },
  highlightsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  highlightChip: {
    backgroundColor: "rgba(240, 214, 138, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(240, 214, 138, 0.28)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highlightChipText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 11,
    color: "#F0D68A",
  },
  controlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  timecode: {
    fontFamily: fontFamily.sansBold,
    fontSize: 11.5,
    color: "#8E9EB3",
    minWidth: 68,
  },
  transportGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skipBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0D68A",
    alignItems: "center",
    justifyContent: "center",
  },
  donePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  donePillText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12,
    color: "#FFFFFF",
  },
});

