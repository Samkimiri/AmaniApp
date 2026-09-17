import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { IconProps, LockIcon, NotesIcon, OpenBookIcon } from "./icons";

interface Step {
  icon: (props: IconProps) => React.ReactNode;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: (p) => <OpenBookIcon {...p} />,
    title: "Welcome to Amani",
    body: "Take sermon notes and read Scripture, fully offline — no connection needed once it's loaded.",
  },
  {
    icon: (p) => <NotesIcon {...p} />,
    title: "Write, record, and organize",
    body: "Add photos, audio, verses, subheadings, and highlights to any note. Swipe left on a photo, verse, or recording to remove it.",
  },
  {
    icon: (p) => <OpenBookIcon {...p} />,
    title: "Five Bibles, always with you",
    body: "Search any reference or keyword, bookmark and highlight verses, and switch translations — all bundled in the app itself.",
  },
  {
    icon: (p) => <LockIcon {...p} />,
    title: "Private by default",
    body: "Everything stays on this device unless you choose to back it up yourself — no account required to use Amani.",
  },
];

/** A one-time, four-step walkthrough shown on first launch — pair with
 * useOnboarding() so it never shows again once dismissed. */
export function OnboardingModal({ visible, onComplete }: { visible: boolean; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const colors = useColors();
  const styles = makeStyles(colors);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    if (isLast) {
      onComplete();
      setStep(0);
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={next}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Pressable
            onPress={() => {
              onComplete();
              setStep(0);
            }}
            style={styles.skipButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Skip walkthrough"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          <View style={styles.iconWrap}>{current.icon({ size: 30, color: colors.gold })}</View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <Pressable
            onPress={next}
            style={styles.nextButton}
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Get started" : "Next"}
          >
            <Text style={styles.nextButtonText}>{isLast ? "Get started" : "Next"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", padding: 28 },
    card: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: colors.card,
      borderRadius: 22,
      padding: 26,
      alignItems: "center",
    },
    skipButton: { position: "absolute", top: 16, right: 18 },
    skipText: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.textMuted },
    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.verseBg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    title: {
      fontFamily: fontFamily.serifBold,
      fontSize: 19,
      color: colors.textPrimary,
      marginTop: 18,
      textAlign: "center",
    },
    body: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
    },
    dots: { flexDirection: "row", gap: 6, marginTop: 22 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.gold, width: 16 },
    nextButton: {
      marginTop: 22,
      width: "100%",
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    nextButtonText: { fontFamily: fontFamily.sansBold, fontSize: 14.5, color: colors.white },
  });
}
