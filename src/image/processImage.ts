import { atkinsonDither } from "@/dithering/atkinson";
import { jarvisDither } from "@/dithering/jarvis";
import { thresholdDither } from "@/dithering/threshold";
import { toGrayscale } from "@/image/grayscale";
import { resizeImageData } from "@/image/resize";
import { clampThreshold, type DitherAlgorithm } from "@/presets/default";

export type ProcessImageOptions = {
  algorithm: DitherAlgorithm;
  threshold: number;
  /** Max sidlängd för preview. Utelämna/undefined = ingen nedskalning (export). */
  maxSize?: number;
};

export function processImage(
  source: ImageData,
  options: ProcessImageOptions,
): ImageData {
  const threshold = clampThreshold(options.threshold);
  const resized =
    options.maxSize != null
      ? resizeImageData(source, options.maxSize)
      : source;
  const gray = toGrayscale(resized);

  switch (options.algorithm) {
    case "jarvis":
      return jarvisDither(gray, threshold);
    case "atkinson":
      return atkinsonDither(gray, threshold);
    case "threshold":
      return thresholdDither(gray, threshold);
    default:
      return jarvisDither(gray, threshold);
  }
}
