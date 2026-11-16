import { describe, expect, it } from "vitest";
import { processImage } from "@/image/processImage";
import { createImageData } from "@/test/imageData";

describe("processImage skipDither", () => {
  it("quantizes without error diffusion", () => {
    const src = createImageData(4, 1, (x) =>
      x < 2 ? [10, 10, 10, 255] : [200, 200, 200, 255],
    );
    const out = processImage(src, {
      algorithm: "atkinson",
      threshold: 50,
      skipDither: true,
    });
    expect(out.data[0]).toBe(0);
    expect(out.data[4]).toBe(0);
    expect(out.data[8]).toBe(255);
    expect(out.data[12]).toBe(255);
  });
});
