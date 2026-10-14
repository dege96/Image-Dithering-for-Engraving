import { describe, expect, it } from "vitest";
import { randomThresholdDither } from "@/dithering/randomThreshold";
import { createImageData } from "@/test/imageData";

describe("randomThresholdDither", () => {
  it("produces more mixed pixels with higher noise amplitude", () => {
    const src = createImageData(32, 32, () => [128, 128, 128, 255]);
    const calm = randomThresholdDither(src, 50, 0);
    const grainy = randomThresholdDither(src, 50, 64);

    let calmBlack = 0;
    let grainyBlack = 0;
    for (let i = 0; i < calm.data.length; i += 4) {
      if (calm.data[i]! < 128) calmBlack++;
      if (grainy.data[i]! < 128) grainyBlack++;
    }
    // Zero amplitude + mid gray at threshold 50 → all white (128 is not < 127.5)
    expect(calmBlack).toBe(0);
    expect(grainyBlack).toBeGreaterThan(0);
  });
});
