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
import { normalizeLevels } from "@/image/normalizeLevels";
import { resizeImageData } from "@/image/resize";
import { clampThreshold, type DitherAlgorithm } from "@/presets/default";

export type ProcessImageOptions = {
  algorithm: DitherAlgorithm;
  threshold: number;
  /** Max sidlängd för preview. Utelämna/undefined = ingen nedskalning (export). */
  maxSize?: number;
  /** Auto-levels före dither. Default false — behåller mjuka gradienter. */
  normalize?: boolean;
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
  const prepared =
    options.normalize === true ? normalizeLevels(gray) : gray;

  switch (options.algorithm) {
    case "jarvis":
      return jarvisDither(prepared, threshold);
    case "atkinson":
      return atkinsonDither(prepared, threshold);
    case "floydSteinberg":
      return floydSteinbergDither(prepared, threshold);
    case "stucki":
      return stuckiDither(prepared, threshold);
    case "sierraLite":
      return sierraLiteDither(prepared, threshold);
    case "bayer4":
      return bayer4Dither(prepared, threshold);
    case "bayer8":
      return bayer8Dither(prepared, threshold);
    case "blueNoise":
      return blueNoiseDither(prepared, threshold);
    case "halftone":
      return halftoneDither(prepared, threshold);
    case "randomThreshold":
      return randomThresholdDither(prepared, threshold);
    case "threshold":
      return thresholdDither(prepared, threshold);
    default:
      return jarvisDither(prepared, threshold);
  }
}
