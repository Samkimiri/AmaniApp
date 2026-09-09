import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { LockIcon } from "./icons";
import { PinPad } from "./PinPad";
import { useAppLockContext } from "@/context/AppLockContext";
import { appLock, AUTO_LOCK_LABELS, AutoLockOption } from "@/data/appLock";

type Step =
  | { kind: "create" }
  | { kind: "confirm"; pin: string }
  | { kind: "verifyToDisable" }
  | { kind: "verifyToChange" };

const AUTO_LOCK_OPTIONS: AutoLockOption[] = ["immediate", "1m", "5m", "15m"];

export function AppLockSection() {
  const { enabled, autoLock, enableLock, changeAutoLock, disableLock, lockNow } = useAppLockContext();
  const [step, setStep] = useState<Step | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    setStep(null);
    setValue("");
    setError(null);
  }

  async function handlePinComplete(pin: string) {
    if (!step) return;

    if (step.kind === "create") {
      setStep({ kind: "confirm", pin });
      setValue("");
      return;
    }

    if (step.kind === "confirm") {
      if (pin !== step.pin) {
        setError("PINs didn't match — try again");
        setStep({ kind: "create" });
        setValue("");
        return;
      }
      await enableLock(pin, autoLock);
      closeModal();
      return;
    }

    if (step.kind === "verifyToDisable") {
      const ok = await disableLock(pin);
      if (!ok) {
        setError("Incorrect PIN");
        setValue("");
        return;
      }
      closeModal();
      return;
    }

    if (step.kind === "verifyToChange") {
      const ok = await appLock.verifyPin(pin);
      if (!ok) {
        setError("Incorrect PIN");
        setValue("");
        return;
      }
      setError(null);
      setStep({ kind: "create" });
      setValue("");
      return;
    }
  }

  function handleChange(next: string) {
    setError(null);
    setValue(next);
    if (next.length === 4) {
      handlePinComplete(next);
    }
  }

  const modalCopy: Record<Step["kind"], { title: string; subtitle: string }> = {
    create: { title: "Create a PIN", subtitle: "Choose 4 digits to lock Amani" },
    confirm: { title: "Confirm your PIN", subtitle: "Enter the same 4 digits again" },
    verifyToDisable: { title: "Enter your PIN", subtitle: "Confirm to turn app lock off" },
    verifyToChange: { title: "Enter your current PIN", subtitle: "Confirm before choosing a new one" },
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <LockIcon size={18} color={colors.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>App lock</Text>
          <Text style={styles.rowSubtitle}>
            {enabled ? "A PIN is required to open Amani" : "Protect your notes with a PIN on this device"}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={(next) => {
            if (next) {
              setError(null);
              setStep({ kind: "create" });
            } else {
              setError(null);
              setStep({ kind: "verifyToDisable" });
            }
          }}
          trackColor={{ true: colors.navy, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      {enabled ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.label}>Lock after</Text>
          <View style={styles.chipRow}>
            {AUTO_LOCK_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.chip, autoLock === opt && styles.chipActive]}
                onPress={() => changeAutoLock(opt)}
              >
                <Text style={[styles.chipText, autoLock === opt && styles.chipTextActive]}>
                  {AUTO_LOCK_LABELS[opt]}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.textButton}
              onPress={() => {
                setError(null);
                setStep({ kind: "verifyToChange" });
              }}
            >
              <Text style={styles.textButtonLabel}>Change PIN</Text>
            </Pressable>
            <Pressable style={styles.textButton} onPress={lockNow}>
              <Text style={styles.textButtonLabel}>Lock now</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <Modal visible={step !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            {step ? (
              <>
                <Text style={styles.sheetTitle}>{modalCopy[step.kind].title}</Text>
                <Text style={styles.sheetSubtitle}>{error ?? modalCopy[step.kind].subtitle}</Text>
                <PinPad value={value} onChange={handleChange} error={!!error} />
                <Pressable style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.verseBg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontFamily: fontFamily.sansBold, fontSize: 13.5, color: colors.textPrimary },
  rowSubtitle: { fontFamily: fontFamily.sansRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 14 },
  label: {
    fontFamily: fontFamily.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textFaint,
    marginBottom: 8,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontFamily: fontFamily.sansSemibold, fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  actionsRow: { flexDirection: "row", gap: 20, marginTop: 16 },
  textButton: { paddingVertical: 4 },
  textButtonLabel: { fontFamily: fontFamily.sansBold, fontSize: 12.5, color: colors.gold },

  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center" },
  sheet: {
    width: 320,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  sheetTitle: { fontFamily: fontFamily.serifBold, fontSize: 18, color: colors.textPrimary, marginBottom: 4 },
  sheetSubtitle: { fontFamily: fontFamily.sansMedium, fontSize: 12.5, color: colors.textMuted, marginBottom: 24 },
  cancelButton: { marginTop: 20 },
  cancelText: { fontFamily: fontFamily.sansBold, fontSize: 13, color: colors.textMuted },
});
