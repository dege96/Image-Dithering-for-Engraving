import { atkinsonDither } from "@/dithering/atkinson";
import { bayer4Dither, bayer8Dither } from "@/dithering/bayer";
import { blueNoiseDither } from "@/dithering/blueNoise";
import { floydSteinbergDither } from "@/dithering/floydSteinberg";
import { halftoneDither } from "@/dithering/halftone";
import { jarvisDither } from "@/dithering/jarvis";
import { randomThresholdDither } from "@/dithering/randomThreshold";
import { sierraLiteDither } from "@/dithering/sierraLite";
import { stuckiDither } from "@/dithering/stucki";
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
    case "floydSteinberg":
      return floydSteinbergDither(gray, threshold);
    case "stucki":
      return stuckiDither(gray, threshold);
    case "sierraLite":
      return sierraLiteDither(gray, threshold);
    case "bayer4":
      return bayer4Dither(gray, threshold);
    case "bayer8":
      return bayer8Dither(gray, threshold);
    case "blueNoise":
      return blueNoiseDither(gray, threshold);
    case "halftone":
      return halftoneDither(gray, threshold);
    case "randomThreshold":
      return randomThresholdDither(gray, threshold);
    case "threshold":
      return thresholdDither(gray, threshold);
    default:
      return jarvisDither(gray, threshold);
  }
}
