import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { appLock, autoLockDelayMs, AutoLockOption } from "@/data/appLock";

/**
 * Local app-lock (PIN) gate. There's no account or server here — this only
 * protects the notes already stored on this device from someone else
 * picking up the phone or browser tab, matching Amani's "no account
 * needed" design (see Profile). The user enables it, sets a PIN once, and
 * chooses how quickly it should re-lock after the app is backgrounded.
 */
export function useAppLock() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [autoLock, setAutoLockState] = useState<AutoLockOption>("immediate");
  const [locked, setLocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    appLock.getSettings().then((s) => {
      setEnabled(s.enabled);
      setAutoLockState(s.autoLock);
      setLocked(s.enabled); // always require the PIN on a fresh launch/reload
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "background" || next === "inactive") {
        backgroundedAt.current = Date.now();
      } else if (next === "active" && backgroundedAt.current !== null) {
        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (elapsed >= autoLockDelayMs(autoLock)) {
          setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, [enabled, autoLock]);

  const unlock = useCallback(async (pin: string) => {
    const ok = await appLock.verifyPin(pin);
    if (ok) setLocked(false);
    return ok;
  }, []);

  const lockNow = useCallback(() => {
    if (enabled) setLocked(true);
  }, [enabled]);

  const enableLock = useCallback(async (pin: string, option: AutoLockOption) => {
    await appLock.setPin(pin, option);
    setEnabled(true);
    setAutoLockState(option);
    setLocked(false);
  }, []);

  const changeAutoLock = useCallback(async (option: AutoLockOption) => {
    await appLock.setAutoLock(option);
    setAutoLockState(option);
  }, []);

  const disableLock = useCallback(async (pin: string) => {
    const ok = await appLock.verifyPin(pin);
    if (ok) {
      await appLock.disable();
      setEnabled(false);
      setLocked(false);
    }
    return ok;
  }, []);

  return { loading, enabled, autoLock, locked, unlock, lockNow, enableLock, changeAutoLock, disableLock };
}
