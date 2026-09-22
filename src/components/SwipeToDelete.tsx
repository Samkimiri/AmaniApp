import React, { useMemo, useRef } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { TrashIcon } from "./icons";

const DELETE_THRESHOLD = -84;
const MAX_DRAG = -140;

/**
 * Swipe-left-to-delete, built on React Native's built-in PanResponder
 * rather than a gesture library — no extra native dependency, and it
 * works the same on web (react-native-web maps pointer/touch events onto
 * the same responder system) as on iOS/Android.
 *
 * Deletes immediately past the threshold, no confirmation dialog — like
 * Mail's swipe-to-delete. That's safe here because every delete this
 * wraps (a note, a note block) is already covered by undo/redo or a
 * separate confirm-first path (long-press in the notes list); this is
 * meant to be the fast, deliberate gesture, not the only way to delete.
 */
export function SwipeToDelete({
  children,
  onDelete,
  disabled,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        !disabled && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) translateX.setValue(Math.max(gesture.dx, MAX_DRAG));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < DELETE_THRESHOLD) {
          Animated.timing(translateX, { toValue: -600, duration: 180, useNativeDriver: true }).start(() => {
            onDelete();
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={styles.deleteBackdrop} pointerEvents="none">
        <TrashIcon size={18} color={colors.white} />
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: { position: "relative" },
    deleteBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.danger,
      borderRadius: 16,
      alignItems: "flex-end",
      justifyContent: "center",
      paddingRight: 24,
    },
  });
}
