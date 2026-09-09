import { useEffect, useState } from "react";
import { Platform } from "react-native";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Surfaces a real "Install Amani" call to action on web, instead of
 * relying on a visitor noticing the browser's own (often subtle) install
 * icon. Chrome/Edge on Android and desktop fire `beforeinstallprompt`
 * when the page qualifies as an installable PWA (manifest + service
 * worker + HTTPS); we capture that event and trigger it ourselves when
 * the user taps our button. No-ops on native and on browsers that don't
 * support the event (notably Safari/iOS, which uses its own Share ->
 * Add to Home Screen flow instead).
 */
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }

  return { available: !!deferredEvent && !installed, promptInstall };
}
