import React, { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "./ThemeContext";
import { fontFamily } from "@/theme/typography";

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 2200;

/**
 * A lightweight, auto-dismissing confirmation — "Copied", "Backup
 * restored" — for actions that don't need a decision or an acknowledged
 * dismissal. Alert (AlertContext) is still used for anything destructive,
 * anything with its own action buttons, or anything the user genuinely
 * needs to read and dismiss on purpose (permission prompts, errors).
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const colors = useColors();
  const styles = makeStyles(colors);

  const show = useCallback(
    (text: string) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMessage(text);
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setMessage(null);
        });
      }, VISIBLE_MS);
    },
    [opacity]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message ? (
        <Animated.View pointerEvents="none" style={[styles.wrap, { opacity }]}>
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx.show;
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 24,
      right: 24,
      bottom: 100,
      alignItems: "center",
    },
    text: {
      backgroundColor: colors.navy,
      color: colors.white,
      fontFamily: fontFamily.sansBold,
      fontSize: 13,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 999,
      overflow: "hidden",
      textAlign: "center",
    },
  });
}
