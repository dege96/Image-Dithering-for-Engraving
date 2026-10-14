import { describe, expect, it } from "vitest";
import { halftoneDither } from "@/dithering/halftone";
import { createImageData } from "@/test/imageData";

describe("halftoneDither", () => {
  it("uses coarser cells when cellScale is higher", () => {
    // Gradient so cell averaging differs with cell size
    const src = createImageData(150, 150, (x, y) => {
      const v = Math.round(((x + y) / 300) * 255);
      return [v, v, v, 255];
    });
    const fine = halftoneDither(src, 35, 0.5);
    const coarse = halftoneDither(src, 35, 2.5);

    let fineBlack = 0;
    let coarseBlack = 0;
    for (let i = 0; i < fine.data.length; i += 4) {
      if (fine.data[i]! < 128) fineBlack++;
      if (coarse.data[i]! < 128) coarseBlack++;
    }
    // Different scales should not produce identical bitmaps
    expect(fineBlack).not.toBe(coarseBlack);
  });
});
