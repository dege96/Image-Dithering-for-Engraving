import { clampContrast, clampGamma } from "@/presets/default";

/**
 * Kontrast + gamma på grayscale före dither.
 * Kontrast runt mittgrått (128), därefter gamma-kurva.
 * Defaults 1/1 = identity (returnerar samma ImageData).
 */
export function adjustTone(
  imageData: ImageData,
  contrast: number,
  gamma: number,
): ImageData {
  const c = clampContrast(contrast);
  const g = clampGamma(gamma);
  if (c === 1 && g === 1) {
    return imageData;
  }

  const { width, height, data } = imageData;
  const out = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]!;
    if (alpha === 0) {
      out.data[i] = 255;
      out.data[i + 1] = 255;
      out.data[i + 2] = 255;
      out.data[i + 3] = 0;
      continue;
    }

    let v = data[i]!;
    if (c !== 1) {
      v = (v - 128) * c + 128;
    }
    v = Math.max(0, Math.min(255, v));
    if (g !== 1) {
      v = 255 * Math.pow(v / 255, g);
    }
    const rounded = Math.max(0, Math.min(255, Math.round(v)));
    out.data[i] = rounded;
    out.data[i + 1] = rounded;
    out.data[i + 2] = rounded;
    out.data[i + 3] = alpha;
  }

  return out;
}
