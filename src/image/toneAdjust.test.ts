import { describe, expect, it } from "vitest";
import { adjustTone } from "@/image/toneAdjust";
import { createImageData } from "@/test/imageData";

describe("adjustTone", () => {
  it("returns the same ImageData when contrast and gamma are 1", () => {
    const src = createImageData(2, 2, () => [100, 100, 100, 255]);
    expect(adjustTone(src, 1, 1)).toBe(src);
  });

  it("leaves mid-gray unchanged under contrast-only", () => {
    const src = createImageData(1, 1, () => [128, 128, 128, 255]);
    const out = adjustTone(src, 1.5, 1);
    expect(out.data[0]).toBe(128);
  });

  it("increases contrast around mid-gray", () => {
    const src = createImageData(1, 1, () => [160, 160, 160, 255]);
    const out = adjustTone(src, 2, 1);
    // (160 - 128) * 2 + 128 = 192
    expect(out.data[0]).toBe(192);
  });

  it("applies gamma and clamps to 0–255", () => {
    const src = createImageData(1, 1, () => [64, 64, 64, 255]);
    const out = adjustTone(src, 1, 2);
    // 255 * (64/255)^2 ≈ 16
    expect(out.data[0]).toBe(16);
  });

  it("leaves transparent pixels untouched", () => {
    const src = createImageData(1, 1, () => [80, 80, 80, 0]);
    const out = adjustTone(src, 2, 0.5);
    expect(out.data[3]).toBe(0);
    expect(out.data[0]).toBe(255);
  });
});
