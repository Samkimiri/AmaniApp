import { makeShadows, radius, spacing } from "./tokens";
import { darkColors, lightColors, readingColors } from "./colors";

describe("theme tokens", () => {
  it("exposes a consistent spacing scale and radii", () => {
    expect(spacing.xs).toBeLessThan(spacing.sm);
    expect(spacing.sm).toBeLessThan(spacing.lg);
    expect(radius.lg).toBeGreaterThan(radius.md);
    expect(radius.md).toBeGreaterThan(radius.sm);
    expect(radius.pill).toBeGreaterThanOrEqual(999);
  });

  it("builds every elevation level for every palette", () => {
    for (const palette of [lightColors, darkColors, readingColors]) {
      const shadows = makeShadows(palette);
      expect(shadows.none).toEqual({});
      for (const level of ["sm", "md", "lg", "top"] as const) {
        expect(Object.keys(shadows[level]).length).toBeGreaterThan(0);
      }
    }
  });

  it("tints elevation with the palette's own shadow tone", () => {
    // Light tints navy, dark tints black — so the two must not be identical.
    expect(JSON.stringify(makeShadows(lightColors).sm)).not.toEqual(
      JSON.stringify(makeShadows(darkColors).sm)
    );
  });
});
