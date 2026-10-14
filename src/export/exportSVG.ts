import {
  APP_VERSION,
  clampThreshold,
  type DitherAlgorithm,
} from "@/presets/default";
import { processImageAsync } from "@/image/processImageClient";
import type { ExportMetadata } from "@/export/exportPNG";
import { downloadBlob } from "@/export/exportPNG";
import {
  buildSvgFilename,
  imageDataToSvg,
  type SvgExportOptions,
} from "@/export/svgGeometry";

export type { SvgExportOptions };
export { buildSvgFilename, imageDataToSvg };

/**
 * Exporterar gravyr-SVG i full pipeline-upplösning via Web Worker när möjligt.
 */
export async function exportSVG(
  foregroundImage: ImageData,
  algorithm: DitherAlgorithm,
  threshold: number,
  options?: SvgExportOptions & { normalize?: boolean },
): Promise<{ blob: Blob; filename: string; metadata: ExportMetadata }> {
  const clamped = clampThreshold(threshold);
  const processed = await processImageAsync(foregroundImage, {
    algorithm,
    threshold: clamped,
    normalize: options?.normalize,
  });

  const metadata: ExportMetadata = {
    algorithm,
    threshold: clamped,
    version: APP_VERSION,
  };

  const svg = imageDataToSvg(processed, metadata, options);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  return {
    blob,
    filename: buildSvgFilename(algorithm, clamped),
    metadata,
  };
}

export { downloadBlob };
