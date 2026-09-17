import React, { createContext, useCallback, useContext, useState, type PropsWithChildren } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "./ThemeContext";
import { fontFamily } from "@/theme/typography";

export interface AlertAction {
  label: string;
  style?: "default" | "destructive" | "cancel";
  onPress?: () => void;
}

export interface AlertOptions {
  title: string;
  message?: string;
  actions?: AlertAction[];
}

interface AlertContextValue {
  show: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

/**
 * Cross-platform replacement for React Native's `Alert.alert`.
 *
 * `Alert.alert` from `react-native` is a documented no-op on web (it's
 * stubbed out by `react-native-web`) — since this app now ships as a PWA,
 * every dialog that used it (share errors, permission prompts, the photo
 * source picker) would silently do nothing in a browser. This renders a
 * real, themed modal on every platform instead.
 */
export function AlertProvider({ children }: PropsWithChildren) {
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const colors = useColors();
  const styles = makeStyles(colors);

  const show = useCallback((opts: AlertOptions) => setOptions(opts), []);
  const close = useCallback(() => setOptions(null), []);

  return (
    <AlertContext.Provider value={{ show }}>
      {children}
      <Modal visible={options !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.scrim} onPress={close} />
        <View style={[styles.sheetWrap, { pointerEvents: "box-none" }]}>
          <View style={styles.sheet}>
            {options ? (
              <>
                <Text style={styles.title}>{options.title}</Text>
                {options.message ? <Text style={styles.message}>{options.message}</Text> : null}
                <View style={styles.actions}>
                  {(options.actions ?? [{ label: "OK" }]).map((action, i) => (
                    <Pressable
                      key={i}
                      style={({ pressed }) => [
                        styles.actionButton,
                        action.style === "cancel" && styles.actionButtonCancel,
                        pressed && styles.actionPressed,
                      ]}
                      onPress={() => {
                        close();
                        action.onPress?.();
                      }}
                    >
                      <Text
                        style={[
                          styles.actionLabel,
                          action.style === "destructive" && styles.actionLabelDestructive,
                          action.style === "cancel" && styles.actionLabelCancel,
                        ]}
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert(): (options: AlertOptions) => void {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx.show;
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
    sheetWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    sheet: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 22,
    },
    title: { fontFamily: fontFamily.serifBold, fontSize: 17, color: colors.textPrimary, marginBottom: 6 },
    message: { fontFamily: fontFamily.sansRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
    actions: { marginTop: 20, gap: 8 },
    actionButton: {
      height: 46,
      borderRadius: 12,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    actionButtonCancel: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    actionPressed: { opacity: 0.85 },
    actionLabel: { fontFamily: fontFamily.sansBold, fontSize: 14.5, color: colors.white },
    actionLabelDestructive: { color: "#FF9B90" },
    actionLabelCancel: { color: colors.textSecondary },
  });
}
