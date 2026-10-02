import AsyncStorage from "@react-native-async-storage/async-storage";
import { appLock, getLockoutRemainingMs } from "./appLock";

// Deterministic, fast stand-in for the real digest, so these tests exercise
// the lockout schedule and the legacy-hash upgrade path rather than how long
// 200 real SHA-256 passes take.
jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  digestStringAsync: jest.fn(async (_algorithm: string, value: string) => `h${value.length}:${value}`),
  getRandomBytesAsync: jest.fn(async (length: number) =>
    Uint8Array.from({ length }, (_, i) => (i * 7 + 1) % 256)
  ),
}));

const STORAGE_KEY = "amani.applock.v1";

describe("appLock", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("accepts the right PIN and rejects the wrong one", async () => {
    await appLock.setPin("1234", "immediate");
    expect(await appLock.verifyPin("1234")).toBe(true);
    expect(await appLock.verifyPin("9999")).toBe(false);
  });

  it("is off by default, and reports the auto-lock delay it was given", async () => {
    expect(await appLock.getSettings()).toEqual({ enabled: false, autoLock: "immediate" });
    await appLock.setPin("1234", "5m");
    expect(await appLock.getSettings()).toEqual({ enabled: true, autoLock: "5m" });
  });

  it("tolerates a few mistypes before imposing any wait", async () => {
    await appLock.setPin("1234", "immediate");
    for (let i = 0; i < 4; i++) expect(await appLock.verifyPin("0000")).toBe(false);
    expect(await getLockoutRemainingMs()).toBe(0);
  });

  it("starts refusing attempts after too many wrong PINs", async () => {
    await appLock.setPin("1234", "immediate");
    for (let i = 0; i < 5; i++) await appLock.verifyPin("0000");
    expect(await getLockoutRemainingMs()).toBeGreaterThan(0);
    // Even the correct PIN is rejected while the wait is in force.
    expect(await appLock.verifyPin("1234")).toBe(false);
  });

  it("starts the count over after a successful unlock", async () => {
    await appLock.setPin("1234", "immediate");
    await appLock.verifyPin("0000");
    expect(await appLock.verifyPin("1234")).toBe(true);
    for (let i = 0; i < 4; i++) expect(await appLock.verifyPin("0000")).toBe(false);
    expect(await getLockoutRemainingMs()).toBe(0);
  });

  it("still accepts a PIN stored by the pre-stretching version, then upgrades it", async () => {
    // Exactly what the old code wrote: a single unsalted-round SHA-256 of
    // "salt:pin", with no hashVersion field at all.
    const salt = "abcd";
    const legacyHash = `h${`${salt}:1234`.length}:${salt}:1234`;
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ enabled: true, salt, pinHash: legacyHash, autoLock: "immediate" })
    );

    expect(await appLock.verifyPin("1234")).toBe(true);

    const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(stored.hashVersion).toBe(2);
    expect(stored.pinHash).not.toBe(legacyHash);
    // ...and the new hash still verifies.
    expect(await appLock.verifyPin("1234")).toBe(true);
  });

  it("turning app lock off clears the stored PIN", async () => {
    await appLock.setPin("1234", "immediate");
    await appLock.disable();
    expect(await appLock.verifyPin("1234")).toBe(false);
    expect((await appLock.getSettings()).enabled).toBe(false);
  });
});