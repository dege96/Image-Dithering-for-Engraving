import { describe, expect, it } from "vitest";
import { imageDataToSvg } from "@/export/svgGeometry";
import { createImageData } from "@/test/imageData";

describe("imageDataToSvg", () => {
  it("emits mm units and viewBox matching pixels", () => {
    const img = createImageData(4, 2, (x) =>
      x < 2 ? [0, 0, 0, 255] : [255, 255, 255, 255],
    );
    const svg = imageDataToSvg(img, {
      algorithm: "jarvis",
      threshold: 50,
      version: "1.0",
    });
    expect(svg).toContain('width="0.4mm"');
    expect(svg).toContain('height="0.2mm"');
    expect(svg).toContain('viewBox="0 0 4 2"');
    expect(svg).not.toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#000000"');
  });

  it("honors widthMm override", () => {
    const img = createImageData(100, 50, () => [0, 0, 0, 255]);
    const svg = imageDataToSvg(
      img,
      { algorithm: "jarvis", threshold: 50, version: "1.0" },
      { widthMm: 50 },
    );
    expect(svg).toContain('width="50mm"');
    expect(svg).toContain('height="25mm"');
  });
});
