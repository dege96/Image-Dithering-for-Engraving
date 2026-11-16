import { resizeImageData } from "@/image/resize";

/** Proxy-storlek för snabb analys (påverkar inte exportbilden). */
const ANALYZE_MAX_SIZE = 512;

export type PortraitAnalysis = {
  width: number;
  height: number;
  meanLuma: number;
  p2: number;
  p98: number;
  dynamicRange: number;
  clipLowPct: number;
  clipHighPct: number;
  sharpness: number;
  noise: number;
  borderUniformity: number;
  borderInnerDelta: number;
  /** Nästan enbart svart/vitt — undvik ny dither. */
  likelyAlreadyBinary: boolean;
  /** Bakgrund verkar enhetlig eller rörig nog att BG-remove hjälper. */
  suggestRemoveBackground: boolean;
  /** Platt histogram → auto-levels hjälper. */
  suggestNormalize: boolean;
  /** Föreslagen kontrast/gamma (1 = oförändrad). */
  suggestedContrast: number;
  suggestedGamma: number;
  /** Högt brus → mild denoise. */
  suggestDenoise: boolean;
  /** Låg skärpa + platt ton → mild lokal kontrast. */
  suggestLocalContrast: boolean;
};

function lumaAt(data: Uint8ClampedArray, i: number): number {
  return 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
}

function percentileSorted(sorted: Float32Array, p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((p / 100) * (sorted.length - 1))),
  );
  return sorted[idx]!;
}

/**
 * Analyserar exponering, kontrast, skärpa, brus och bakgrundsheuristik.
 * Körs på nedskalad kopia — muterar aldrig källbilden.
 */
export function analyzePortrait(source: ImageData): PortraitAnalysis {
  const proxy = resizeImageData(source, ANALYZE_MAX_SIZE);
  const { width, height, data } = proxy;
  const values: number[] = [];
  let meanSum = 0;
  let clipLow = 0;
  let clipHigh = 0;
  let binaryCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 8) continue;
    const y = lumaAt(data, i);
    values.push(y);
    meanSum += y;
    if (y <= 8) clipLow++;
    if (y >= 247) clipHigh++;
    if (y <= 16 || y >= 239) binaryCount++;
  }

  const n = values.length || 1;
  const meanLuma = meanSum / n;
  const sorted = Float32Array.from(values.sort((a, b) => a - b));
  const p2 = percentileSorted(sorted, 2);
  const p98 = percentileSorted(sorted, 98);
  const dynamicRange = Math.max(0, p98 - p2);

  // Laplacian-varians (skärpa) + residual mot 3×3-medel (brus)
  let lapSum = 0;
  let lapSq = 0;
  let noiseSum = 0;
  let lapN = 0;

  const borderYs: number[] = [];
  const innerYs: number[] = [];
  const bx0 = Math.floor(width * 0.1);
  const bx1 = Math.ceil(width * 0.9);
  const by0 = Math.floor(height * 0.1);
  const by1 = Math.ceil(height * 0.9);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3]! < 8) continue;
      const c = lumaAt(data, i);
      const up = lumaAt(data, ((y - 1) * width + x) * 4);
      const dn = lumaAt(data, ((y + 1) * width + x) * 4);
      const lf = lumaAt(data, (y * width + (x - 1)) * 4);
      const rt = lumaAt(data, (y * width + (x + 1)) * 4);
      const lap = up + dn + lf + rt - 4 * c;
      lapSum += lap;
      lapSq += lap * lap;
      lapN++;

      const avg =
        (c +
          up +
          dn +
          lf +
          rt +
          lumaAt(data, ((y - 1) * width + (x - 1)) * 4) +
          lumaAt(data, ((y - 1) * width + (x + 1)) * 4) +
          lumaAt(data, ((y + 1) * width + (x - 1)) * 4) +
          lumaAt(data, ((y + 1) * width + (x + 1)) * 4)) /
        9;
      noiseSum += Math.abs(c - avg);

      const inBorder = x < bx0 || x >= bx1 || y < by0 || y >= by1;
      if (inBorder) borderYs.push(c);
      else if (x >= width * 0.25 && x < width * 0.75 && y >= height * 0.25 && y < height * 0.75) {
        innerYs.push(c);
      }
    }
  }

  const sharpness = lapN > 0 ? lapSq / lapN - (lapSum / lapN) ** 2 : 0;
  const noise = lapN > 0 ? noiseSum / lapN : 0;

  const borderMean =
    borderYs.reduce((a, b) => a + b, 0) / Math.max(1, borderYs.length);
  const borderVar =
    borderYs.reduce((a, b) => a + (b - borderMean) ** 2, 0) /
    Math.max(1, borderYs.length);
  const borderUniformity = 1 / (1 + borderVar / 400);
  const innerMean =
    innerYs.reduce((a, b) => a + b, 0) / Math.max(1, innerYs.length);
  const borderInnerDelta = Math.abs(borderMean - innerMean);

  const likelyAlreadyBinary = binaryCount / n >= 0.9 && dynamicRange > 200;
  const suggestNormalize = dynamicRange < 140 && !likelyAlreadyBinary;
  const suggestDenoise = noise > 6.5 && sharpness < 180;
  const suggestLocalContrast =
    dynamicRange < 120 && sharpness < 80 && !likelyAlreadyBinary;

  // Enhetlig kant som skiljer sig från motiv, eller rörig kant → BG-remove hjälper ofta
  const suggestRemoveBackground =
    !likelyAlreadyBinary &&
    (borderUniformity > 0.55 ||
      (borderUniformity < 0.25 && borderInnerDelta > 25) ||
      borderInnerDelta > 40);

  let suggestedContrast = 1;
  let suggestedGamma = 1;
  if (!likelyAlreadyBinary) {
    if (dynamicRange < 100) suggestedContrast = 1.25;
    else if (dynamicRange < 140) suggestedContrast = 1.12;
    if (meanLuma < 95) suggestedGamma = 0.88;
    else if (meanLuma > 175) suggestedGamma = 1.12;
  }

  return {
    width: source.width,
    height: source.height,
    meanLuma,
    p2,
    p98,
    dynamicRange,
    clipLowPct: (clipLow / n) * 100,
    clipHighPct: (clipHigh / n) * 100,
    sharpness,
    noise,
    borderUniformity,
    borderInnerDelta,
    likelyAlreadyBinary,
    suggestRemoveBackground,
    suggestNormalize,
    suggestedContrast,
    suggestedGamma,
    suggestDenoise,
    suggestLocalContrast,
  };
}
