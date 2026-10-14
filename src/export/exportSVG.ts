import { APP_VERSION, type DitherAlgorithm } from "@/presets/default";
import { processImage } from "@/image/processImage";
import type { ExportMetadata } from "@/export/exportPNG";
import { downloadBlob } from "@/export/exportPNG";

export function buildSvgFilename(
  algorithm: DitherAlgorithm,
  threshold: number,
): string {
  return `gravyr-${algorithm}-threshold-${threshold}.svg`;
}

/**
 * Konverterar ditherad bitmap till SVG med svarta run-length-rects
 * (samma idé som bitmap→SVG-verktyg: varje svart pixelrad blir <rect>).
 * Transparenta och vita pixlar hoppas över.
 */
export function imageDataToSvg(
  imageData: ImageData,
  metadata: ExportMetadata,
): string {
  const { width, height, data } = imageData;
  const parts: string[] = [];
  parts.push(
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!-- gravyr ${JSON.stringify({
      algorithm: metadata.algorithm,
      threshold: metadata.threshold,
      version: metadata.version,
    })} -->`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" data-algorithm="${metadata.algorithm}" data-threshold="${metadata.threshold}" data-version="${metadata.version}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
  );

  for (let y = 0; y < height; y++) {
    let runStart = -1;
    for (let x = 0; x <= width; x++) {
      let isBlack = false;
      if (x < width) {
        const i = (y * width + x) * 4;
        const alpha = data[i + 3];
        // Svart dither-pixel (opaque och mörk)
        isBlack = alpha > 8 && data[i] < 128;
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

/**
 * Exporterar gravyr-SVG i full pipeline-upplösning (ingen preview-cap, ingen size-UI).
 */
export async function exportSVG(
  foregroundImage: ImageData,
  algorithm: DitherAlgorithm,
  threshold: number,
): Promise<{ blob: Blob; filename: string; metadata: ExportMetadata }> {
  const processed = processImage(foregroundImage, {
    algorithm,
    threshold,
    // ingen maxSize → högsta bit-rate / full export-upplösning
  });

  const metadata: ExportMetadata = {
    algorithm,
    threshold,
    version: APP_VERSION,
  };

  const svg = imageDataToSvg(processed, metadata);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  return {
    blob,
    filename: buildSvgFilename(algorithm, threshold),
    metadata,
  };
}

export { downloadBlob };
