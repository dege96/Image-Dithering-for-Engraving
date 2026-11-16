import { describe, expect, it } from "vitest";
import { analyzePortrait } from "@/image/analyzePortrait";
import { createImageData } from "@/test/imageData";

describe("analyzePortrait", () => {
  it("flags flat low-contrast images for normalize", () => {
    const img = createImageData(64, 64, () => [120, 120, 120, 255]);
    const a = analyzePortrait(img);
    expect(a.dynamicRange).toBeLessThan(20);
    expect(a.suggestNormalize).toBe(true);
    expect(a.likelyAlreadyBinary).toBe(false);
  });

  it("detects already-binary dither-like images", () => {
    const img = createImageData(32, 32, (x, y) =>
      (x + y) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255],
    );
    const a = analyzePortrait(img);
    expect(a.likelyAlreadyBinary).toBe(true);
    expect(a.suggestNormalize).toBe(false);
  });

  it("suggests lightening gamma for dark images", () => {
    const img = createImageData(48, 48, () => [40, 40, 40, 255]);
    const a = analyzePortrait(img);
    expect(a.meanLuma).toBeLessThan(95);
    expect(a.suggestedGamma).toBeLessThan(1);
  });

  it("suggests background removal for uniform bright border", () => {
    const img = createImageData(80, 80, (x, y) => {
      const border = x < 8 || x >= 72 || y < 8 || y >= 72;
      return border ? [240, 240, 240, 255] : [80, 80, 80, 255];
    });
    const a = analyzePortrait(img);
    expect(a.suggestRemoveBackground).toBe(true);
  });
});
