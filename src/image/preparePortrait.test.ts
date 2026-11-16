import { describe, expect, it } from "vitest";
import { analyzePortrait } from "@/image/analyzePortrait";
import {
  preparePortrait,
  shouldRemoveBackground,
} from "@/image/preparePortrait";
import { OAK_5W_DIODE_V1 } from "@/presets/engravingProfile";
import { createImageData } from "@/test/imageData";

describe("preparePortrait", () => {
  it("skips dither for binary input", () => {
    const img = createImageData(24, 24, (x, y) =>
      (x + y) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255],
    );
    const analysis = analyzePortrait(img);
    const result = preparePortrait(img, analysis, OAK_5W_DIODE_V1);
    expect(result.skipDither).toBe(true);
    expect(result.image).toBe(img);
    expect(result.normalize).toBe(false);
  });

  it("enables normalize for flat tones", () => {
    const img = createImageData(40, 40, () => [130, 130, 130, 255]);
    const analysis = analyzePortrait(img);
    const result = preparePortrait(img, analysis, OAK_5W_DIODE_V1);
    expect(result.skipDither).toBe(false);
    expect(result.normalize).toBe(true);
    expect(result.contrast).toBeGreaterThan(1);
  });
});

describe("shouldRemoveBackground", () => {
  it("honors on/off overrides", () => {
    const img = createImageData(16, 16, () => [128, 128, 128, 255]);
    const analysis = analyzePortrait(img);
    expect(shouldRemoveBackground(analysis, "on")).toBe(true);
    expect(shouldRemoveBackground(analysis, "off")).toBe(false);
    expect(shouldRemoveBackground(analysis, true)).toBe(true);
  });

  it("uses analysis in auto mode", () => {
    const img = createImageData(80, 80, (x, y) => {
      const border = x < 8 || x >= 72 || y < 8 || y >= 72;
      return border ? [250, 250, 250, 255] : [60, 60, 60, 255];
    });
    const analysis = analyzePortrait(img);
    expect(shouldRemoveBackground(analysis, "auto")).toBe(
      analysis.suggestRemoveBackground,
    );
  });
});
