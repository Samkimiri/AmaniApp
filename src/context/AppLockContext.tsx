import React, { createContext, useContext, type PropsWithChildren } from "react";
import { useAppLock } from "@/hooks/useAppLock";

type AppLockValue = ReturnType<typeof useAppLock>;

const AppLockContext = createContext<AppLockValue | null>(null);

/** Single shared app-lock instance, so the root layout's gate and the
 * Profile screen's settings always agree on the current lock state. */
export function AppLockProvider({ children }: PropsWithChildren) {
  const value = useAppLock();
  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLockContext(): AppLockValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error("useAppLockContext must be used within AppLockProvider");
  return ctx;
}
