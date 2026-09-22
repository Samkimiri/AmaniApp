import React, { Component, useMemo, type ErrorInfo, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { OpenBookIcon } from "./icons";

interface State {
  error: Error | null;
}

/** The crash screen's actual UI — split out as a function component so it
 * can read the live theme via `useColors()`; the boundary itself must stay
 * a class component (React has no hook equivalent for componentDidCatch),
 * which can't call hooks directly. */
function ErrorFallback({ onReset }: { onReset: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <OpenBookIcon size={32} color={colors.gold} />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          Amani hit an unexpected error. Your notes are safe on this device — try again, and if it
          keeps happening, reopening the app usually clears it.
        </Text>
        <Pressable style={styles.button} onPress={onReset}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/**
 * Catches render-time errors anywhere in the tree below it. Without this,
 * an unhandled error in any screen blanks the whole app with nothing to
 * recover to — in production exactly as in dev. React error boundaries
 * must be class components; there's no hook equivalent.
 */
export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No crash-reporting service is wired up in this build — logging to
    // the console is the only trace of this today. Wiring a real service
    // (Sentry, Bugsnag) means swapping this one line for its SDK call.
    console.error("Amani crashed:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorFallback onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
    title: { fontFamily: fontFamily.serifBold, fontSize: 19, color: colors.textPrimary, marginTop: 4 },
    message: {
      fontFamily: fontFamily.sansRegular,
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: "center",
    },
    button: {
      marginTop: 8,
      height: 46,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: { fontFamily: fontFamily.sansBold, fontSize: 14, color: colors.white },
  });
}
