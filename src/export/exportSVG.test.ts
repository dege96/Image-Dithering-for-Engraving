import { describe, expect, it } from "vitest";
import {
  blackRectsFromImageData,
  imageDataToSvg,
} from "@/export/svgGeometry";
import { createImageData } from "@/test/imageData";
import { SVG_EXPORT_MAX_SIZE } from "@/presets/default";

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

  it("merges a solid black block into one rect", () => {
    const img = createImageData(3, 3, () => [0, 0, 0, 255]);
    const rects = blackRectsFromImageData(img);
    expect(rects).toEqual([{ x: 0, y: 0, width: 3, height: 3 }]);
    const svg = imageDataToSvg(img, {
      algorithm: "threshold",
      threshold: 50,
      version: "1.0",
    });
    const matches = svg.match(/<rect /g);
    expect(matches).toHaveLength(1);
    expect(svg).toContain('width="3" height="3"');
  });

  it("does not merge across white gaps", () => {
    // Two black rows separated by a white row
    const img = createImageData(2, 3, (_x, y) =>
      y === 1 ? [255, 255, 255, 255] : [0, 0, 0, 255],
    );
    const rects = blackRectsFromImageData(img);
    expect(rects).toEqual([
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 0, y: 2, width: 2, height: 1 },
    ]);
  });

  it("skips fully transparent pixels", () => {
    const img = createImageData(2, 2, (x, y) =>
      x === 0 && y === 0 ? [0, 0, 0, 0] : [0, 0, 0, 255],
    );
    const rects = blackRectsFromImageData(img);
    expect(
      rects.some(
        (r) => r.x === 0 && r.y === 0 && r.width === 1 && r.height === 1,
      ),
    ).toBe(false);
    expect(rects.length).toBeGreaterThan(0);
  });
});

describe("SVG export resolution bound", () => {
  it("exposes SVG_EXPORT_MAX_SIZE for LightBurn-friendly export", () => {
    expect(SVG_EXPORT_MAX_SIZE).toBe(1000);
    expect(SVG_EXPORT_MAX_SIZE).toBeLessThanOrEqual(1200);
  });

  it("preserves physical mm when widthMm is set on a smaller bitmap", () => {
    // Simulates exportSVG after maxSize scale: fewer px, same mm
    const processed = createImageData(1000, 500, () => [0, 0, 0, 255]);
    const svg = imageDataToSvg(
      processed,
      { algorithm: "threshold", threshold: 50, version: "1.0" },
      { widthMm: 200 },
    );
    expect(svg).toContain('width="200mm"');
    expect(svg).toContain('height="100mm"');
    expect(svg).toContain('viewBox="0 0 1000 500"');
    expect(blackRectsFromImageData(processed)).toEqual([
      { x: 0, y: 0, width: 1000, height: 500 },
    ]);
  });
});
