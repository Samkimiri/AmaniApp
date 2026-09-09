import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { fontsToLoad } from "@/theme/typography";
import { colors } from "@/theme/colors";
import { AppLockProvider, useAppLockContext } from "@/context/AppLockContext";
import { AlertProvider } from "@/context/AlertContext";
import { LockScreen } from "@/components/LockScreen";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Decides between the locked PIN screen and the real app, once app-lock
 * settings have loaded. Kept separate from RootLayout so it can read the
 * shared AppLockProvider via context. */
function Gate() {
  const { loading, enabled, locked, unlock } = useAppLockContext();

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

  // The Stack stays mounted underneath the lock screen (rather than being
  // swapped out for it) so navigation state survives a lock/unlock cycle —
  // otherwise "Lock now" from Profile would drop the user back on Home
  // instead of returning them to where they were.
  return (
    <>
      <StatusBar style={enabled && locked ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="note/[id]" options={{ presentation: "card" }} />
      </Stack>
      {enabled && locked ? <LockScreen onUnlock={unlock} /> : null}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontsToLoad);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

  return (
    <AlertProvider>
      <AppLockProvider>
        <Gate />
      </AppLockProvider>
    </AlertProvider>
  );
}
