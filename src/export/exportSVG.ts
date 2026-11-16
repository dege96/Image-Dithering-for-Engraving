import {
  APP_VERSION,
  clampThreshold,
  exportSizeMm,
  type DitherAlgorithm,
} from "@/presets/default";
import { processImageAsync } from "@/image/processImageClient";
import type {
  ExportMetadata,
  ExportProcessOptions,
} from "@/export/exportPNG";
import { downloadBlob } from "@/export/exportPNG";
import {
  buildSvgFilename,
  imageDataToSvg,
  type SvgExportOptions,
} from "@/export/svgGeometry";
import {
  DEFAULT_ENGRAVING_PROFILE,
  effectiveDpi,
  type EngravingProfile,
} from "@/presets/engravingProfile";

export type { SvgExportOptions };
export { buildSvgFilename, imageDataToSvg };

export type ExportSvgResult = {
  blob: Blob;
  filename: string;
  metadata: ExportMetadata;
  widthMm: number;
  heightMm: number;
  /** Effektiv DPI efter raster-nedskalning. */
  dpi: number;
  /** Nominell profil-DPI (storleksberäkning). */
  nominalDpi: number;
  /** Pixelstorlek efter maxSize-skalning. */
  widthPx: number;
  heightPx: number;
};

export type ExportSvgProcessOptions = SvgExportOptions &
  ExportProcessOptions & {
    profile?: EngravingProfile;
    maxSize?: number;
    skipDither?: boolean;
  };

/**
 * Exporterar gravyr-SVG via Web Worker när möjligt.
 * Skalas till profilens raster.maxSize (default oak-5w),
 * men behåller fysisk mm-storlek (widthMm eller profildefault / DPI).
 */
export async function exportSVG(
  foregroundImage: ImageData,
  algorithm: DitherAlgorithm,
  threshold: number,
  options?: ExportSvgProcessOptions,
): Promise<ExportSvgResult> {
  const profile = options?.profile ?? DEFAULT_ENGRAVING_PROFILE;
  const clamped = clampThreshold(threshold);
  const widthMm =
    options?.widthMm != null && options.widthMm > 0
      ? options.widthMm
      : profile.physical.defaultWidthMm;

  const physical = exportSizeMm(
    foregroundImage.width,
    foregroundImage.height,
    { widthMm, dpi: profile.physical.dpi },
  );

  const maxSize = options?.maxSize ?? profile.raster.maxSize;
  const processed = await processImageAsync(foregroundImage, {
    algorithm,
    threshold: clamped,
    maxSize,
    normalize: options?.normalize,
    contrast: options?.contrast,
    gamma: options?.gamma,
    halftoneCellScale: options?.halftoneCellScale,
    noiseAmplitude: options?.noiseAmplitude,
    skipDither: options?.skipDither,
  });

  const dpi = effectiveDpi(processed.width, physical.widthMm);

  const metadata: ExportMetadata = {
    algorithm,
    threshold: clamped,
    version: APP_VERSION,
  };

  const svg = imageDataToSvg(processed, metadata, {
    widthMm: physical.widthMm,
    dpi,
  });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  return {
    blob,
    filename: buildSvgFilename(algorithm, clamped),
    metadata,
    widthMm: physical.widthMm,
    heightMm: physical.heightMm,
    dpi,
    nominalDpi: physical.dpi,
    widthPx: processed.width,
    heightPx: processed.height,
  };
}

export { downloadBlob };
