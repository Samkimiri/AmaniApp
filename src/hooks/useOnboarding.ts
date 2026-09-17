import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "amani.onboardingComplete.v1";

/** Shows the first-run walkthrough exactly once per device, ever. */
export function useOnboarding(): { visible: boolean; complete: () => void } {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (alive && !value) setVisible(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  function complete() {
    setVisible(false);
    AsyncStorage.setItem(STORAGE_KEY, "1").catch(() => {});
  }

  return { visible, complete };
}
