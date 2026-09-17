import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { Analytics } from "@vercel/analytics/react";
import { fontsToLoad } from "@/theme/typography";
import { AppLockProvider, useAppLockContext } from "@/context/AppLockContext";
import { AlertProvider } from "@/context/AlertContext";
import { ThemeProvider, useColors, useTheme } from "@/context/ThemeContext";
import { LockScreen } from "@/components/LockScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { loadSavedTranslation } from "@/data/bible";

SplashScreen.preventAutoHideAsync().catch(() => {});
loadSavedTranslation();

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
      </Stack>
      {enabled && locked ? <LockScreen onUnlock={unlock} /> : null}
    </>
  );
}

function RootLayoutInner() {
  const [fontsLoaded, fontError] = useFonts(fontsToLoad);
  const colors = useColors();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

  return (
    <ErrorBoundary>
      <AlertProvider>
        <AppLockProvider>
          <Gate />
        </AppLockProvider>
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
