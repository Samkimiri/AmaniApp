import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { Analytics } from "@vercel/analytics/react";
import { fontsToLoad } from "@/theme/typography";
import { AppLockProvider, useAppLockContext } from "@/context/AppLockContext";
import { AlertProvider } from "@/context/AlertContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider, useColors, useTheme } from "@/context/ThemeContext";
import { LockScreen } from "@/components/LockScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { loadSavedTranslation } from "@/data/bible";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Kicked off once, at module load, so the Bible text is being read while
// fonts load in parallel. RootLayoutInner keeps the splash screen up until
// this settles — without that, the very first frame could render a screen
// against an empty Bible now that the verse text loads lazily.
const bibleReady = loadSavedTranslation();

/** Decides between the locked PIN screen and the real app, once app-lock
 * settings have loaded. Kept separate from RootLayout so it can read the
 * shared AppLockProvider via context. */
function Gate() {
  const { loading, enabled, locked, unlock } = useAppLockContext();
  const colors = useColors();
  const { scheme } = useTheme();

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

  // The Stack stays mounted underneath the lock screen (rather than being
  // swapped out for it) so navigation state survives a lock/unlock cycle —
  // otherwise "Lock now" from Settings would drop the user back on Home
  // instead of returning them to where they were.
  return (
    <>
      <StatusBar style={enabled && locked ? "light" : scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="note/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="legal" options={{ presentation: "card" }} />
        <Stack.Screen name="bible-read" options={{ presentation: "card" }} />
        <Stack.Screen name="plans" options={{ presentation: "card" }} />
        <Stack.Screen name="stats" options={{ presentation: "card" }} />
        <Stack.Screen name="memorize" options={{ presentation: "card" }} />
      </Stack>
      {enabled && locked ? <LockScreen onUnlock={unlock} /> : null}
    </>
  );
}

function RootLayoutInner() {
  const [fontsLoaded, fontError] = useFonts(fontsToLoad);
  const [bibleLoaded, setBibleLoaded] = useState(false);
  const colors = useColors();

  useEffect(() => {
    let alive = true;
    bibleReady.then(() => {
      if (alive) setBibleLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && bibleLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, bibleLoaded]);

  if ((!fontsLoaded && !fontError) || !bibleLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

  return (
    <ErrorBoundary>
      <AlertProvider>
        <ToastProvider>
          <AppLockProvider>
            <Gate />
          </AppLockProvider>
        </ToastProvider>
      </AlertProvider>
      {/* Anonymous, aggregate page-view analytics only — no note content,
          no personal data. Web only: the underlying package assumes DOM
          APIs that don't exist on native. */}
      {Platform.OS === "web" ? <Analytics /> : null}
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
