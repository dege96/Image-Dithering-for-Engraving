import { describe, expect, it } from "vitest";
import {
  EXPORT_DPI,
  clampContrast,
  clampGamma,
  clampHalftoneCellScale,
  clampNoiseAmplitude,
  clampThreshold,
  exportSizeMm,
  pixelsToMm,
} from "@/presets/default";

describe("clampThreshold", () => {
  it("clamps to 20–55", () => {
    expect(clampThreshold(10)).toBe(20);
    expect(clampThreshold(50)).toBe(50);
    expect(clampThreshold(99)).toBe(55);
  });

  it("handles non-finite", () => {
    expect(clampThreshold(Number.NaN)).toBe(50);
  });
});

describe("exportSizeMm", () => {
  it("converts pixels via DPI", () => {
    const size = exportSizeMm(254, 127);
    expect(size.dpi).toBe(EXPORT_DPI);
    expect(size.widthMm).toBeCloseTo(25.4, 5);
    expect(size.heightMm).toBeCloseTo(12.7, 5);
  });

  it("honors width override and aspect ratio", () => {
    const size = exportSizeMm(200, 100, { widthMm: 80 });
    expect(size.widthMm).toBe(80);
    expect(size.heightMm).toBe(40);
  });
});

describe("pixelsToMm", () => {
  it("matches 254 DPI = 10 px/mm", () => {
    expect(pixelsToMm(10, 254)).toBeCloseTo(1, 5);
  });
});

describe("advanced param clamps", () => {
  it("clamps contrast and gamma", () => {
    expect(clampContrast(0.1)).toBe(0.5);
    expect(clampContrast(1.23)).toBe(1.23);
    expect(clampGamma(3)).toBe(2);
  });

  it("clamps halftone scale and noise amplitude", () => {
    expect(clampHalftoneCellScale(0.1)).toBe(0.5);
    expect(clampHalftoneCellScale(2)).toBe(2);
    expect(clampNoiseAmplitude(-5)).toBe(0);
    expect(clampNoiseAmplitude(99)).toBe(64);
  });
});
