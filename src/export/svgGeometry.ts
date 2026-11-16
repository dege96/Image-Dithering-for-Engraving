import {
  exportSizeMm,
  type DitherAlgorithm,
} from "@/presets/default";
import type { ExportMetadata } from "@/export/exportPNG";

export type SvgExportOptions = {
  /** Önskad bredd i mm. Utelämna = beräkna från pixlar × DPI. */
  widthMm?: number;
  /** Effektiv DPI att skriva i metadata (efter nedskalning). */
  dpi?: number;
};

export function buildSvgFilename(
  algorithm: DitherAlgorithm,
  threshold: number,
): string {
  return `gravyr-${algorithm}-threshold-${threshold}.svg`;
}

function formatMm(value: number): string {
  return (Math.round(value * 1000) / 1000).toString();
}

function isBlackPixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
): boolean {
  const i = (y * width + x) * 4;
  const alpha = data[i + 3]!;
  return alpha > 8 && data[i]! < 128;
}

/**
 * Packar svarta pixlar till maximala axelparallella rektanglar (2D RLE).
 * Expanderar varje fri horisontell körning vertikalt så länge
 * [x0, x1) är helt svart och oanvänd på nästa rader.
 */
export function blackRectsFromImageData(
  imageData: ImageData,
): Array<{ x: number; y: number; width: number; height: number }> {
  const { width, height, data } = imageData;
  const used = new Uint8Array(width * height);
  const rects: Array<{ x: number; y: number; width: number; height: number }> =
    [];

  const freeBlack = (x: number, y: number) =>
    used[y * width + x] === 0 && isBlackPixel(data, width, x, y);

  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      if (!freeBlack(x, y)) {
        x++;
        continue;
      }

      let x1 = x + 1;
      while (x1 < width && freeBlack(x1, y)) x1++;
      const runWidth = x1 - x;

      let h = 1;
      while (y + h < height) {
        let rowOk = true;
        for (let dx = 0; dx < runWidth; dx++) {
          if (!freeBlack(x + dx, y + h)) {
            rowOk = false;
            break;
          }
        }
        if (!rowOk) break;
        h++;
      }

      for (let dy = 0; dy < h; dy++) {
        const row = (y + dy) * width + x;
        used.fill(1, row, row + runWidth);
      }

      rects.push({ x, y, width: runWidth, height: h });
      x = x1;
    }
  }

  return rects;
}

/**
 * Konverterar ditherad bitmap till SVG med 2D-packade svarta rects.
 * Fysisk storlek anges i mm (LightBurn-vänligt). Endast svart geometri.
 */
export function imageDataToSvg(
  imageData: ImageData,
  metadata: ExportMetadata,
  options?: SvgExportOptions,
): string {
  const { width, height } = imageData;
  const size = exportSizeMm(width, height, {
    widthMm: options?.widthMm,
  });
  const widthMm = size.widthMm;
  const heightMm = size.heightMm;
  const dpi = options?.dpi ?? size.dpi;

  const parts: string[] = [];
  parts.push(
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!-- gravyr ${JSON.stringify({
      algorithm: metadata.algorithm,
      threshold: metadata.threshold,
      version: metadata.version,
      dpi,
      widthMm,
      heightMm,
    })} -->`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatMm(widthMm)}mm" height="${formatMm(heightMm)}mm" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" data-algorithm="${metadata.algorithm}" data-threshold="${metadata.threshold}" data-version="${metadata.version}" data-dpi="${dpi}">`,
  );

  for (const r of blackRectsFromImageData(imageData)) {
    parts.push(
      `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="#000000"/>`,
    );
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}
