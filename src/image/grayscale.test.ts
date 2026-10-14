import { describe, expect, it } from "vitest";
import { toGrayscale } from "@/image/grayscale";
import { createImageData } from "@/test/imageData";

describe("toGrayscale", () => {
  it("composites soft alpha onto white so faded edges become light gray", () => {
    const src = createImageData(2, 1, (x) =>
      x === 0 ? [0, 0, 0, 255] : [0, 0, 0, 64],
    );
    const out = toGrayscale(src);

    expect(out.data[0]).toBe(0);
    expect(out.data[3]).toBe(255);

    // black @ 64/255 opacity ≈ 255 * (1 - 64/255) ≈ 191
    expect(out.data[4]).toBe(191);
    expect(out.data[7]).toBe(255);
  });

  it("keeps fully transparent pixels transparent", () => {
    const src = createImageData(1, 1, () => [0, 0, 0, 0]);
    const out = toGrayscale(src);
    expect(out.data[3]).toBe(0);
    expect(out.data[0]).toBe(255);
  });
});
