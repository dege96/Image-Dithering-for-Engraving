import { describe, expect, it } from "vitest";
import { errorDiffusionDither } from "@/dithering/errorDiffusion";
import { floydSteinbergDither } from "@/dithering/floydSteinberg";
import { createImageData } from "@/test/imageData";

describe("errorDiffusionDither", () => {
  it("binarizes a flat mid-gray field to black/white pixels", () => {
    const src = createImageData(8, 8, () => [128, 128, 128, 255]);
    const out = floydSteinbergDither(src, 50);
    let black = 0;
    let white = 0;
    for (let i = 0; i < out.data.length; i += 4) {
      const v = out.data[i]!;
      expect(v === 0 || v === 255).toBe(true);
      if (v === 0) black++;
      else white++;
    }
    expect(black).toBeGreaterThan(0);
    expect(white).toBeGreaterThan(0);
  });

  it("skips transparent pixels", () => {
    const src = createImageData(4, 4, (x, y) =>
      x === 0 && y === 0 ? [0, 0, 0, 0] : [40, 40, 40, 255],
    );
    const out = errorDiffusionDither(
      src,
      50,
      [
        [1, 0, 7],
        [-1, 1, 3],
        [0, 1, 5],
        [1, 1, 1],
      ],
      16,
    );
    expect(out.data[3]).toBe(0);
    expect(out.data[0]).toBe(255);
  });
});
