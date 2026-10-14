import { describe, expect, it } from "vitest";
import { normalizeLevels } from "@/image/normalizeLevels";
import { createImageData } from "@/test/imageData";

describe("normalizeLevels", () => {
  it("stretches a narrow gray band toward 0–255", () => {
    const src = createImageData(16, 16, (x) => {
      const v = 100 + (x % 8);
      return [v, v, v, 255];
    });
    const out = normalizeLevels(src);
    let min = 255;
    let max = 0;
    for (let i = 0; i < out.data.length; i += 4) {
      min = Math.min(min, out.data[i]!);
      max = Math.max(max, out.data[i]!);
    }
    expect(min).toBeLessThan(20);
    expect(max).toBeGreaterThan(230);
  });
});
