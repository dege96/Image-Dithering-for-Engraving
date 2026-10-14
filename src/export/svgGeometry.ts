import {
  exportSizeMm,
  type DitherAlgorithm,
} from "@/presets/default";
import type { ExportMetadata } from "@/export/exportPNG";

export type SvgExportOptions = {
  /** Önskad bredd i mm. Utelämna = beräkna från pixlar × DPI. */
  widthMm?: number;
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

/**
 * Konverterar ditherad bitmap till SVG med svarta run-length-rects.
 * Fysisk storlek anges i mm (LightBurn-vänligt). Endast svart geometri.
 */
export function imageDataToSvg(
  imageData: ImageData,
  metadata: ExportMetadata,
  options?: SvgExportOptions,
): string {
  const { width, height, data } = imageData;
  const { widthMm, heightMm, dpi } = exportSizeMm(width, height, {
    widthMm: options?.widthMm,
  });

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

  for (let y = 0; y < height; y++) {
    let runStart = -1;
    for (let x = 0; x <= width; x++) {
      let isBlack = false;
      if (x < width) {
        const i = (y * width + x) * 4;
        const alpha = data[i + 3]!;
        isBlack = alpha > 8 && data[i]! < 128;
      }
      if (isBlack) {
        if (runStart < 0) runStart = x;
      } else if (runStart >= 0) {
        const runWidth = x - runStart;
        parts.push(
          `<rect x="${runStart}" y="${y}" width="${runWidth}" height="1" fill="#000000"/>`,
        );
        runStart = -1;
      }
    }
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}
