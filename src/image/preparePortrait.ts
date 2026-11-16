import type { PortraitAnalysis } from "@/image/analyzePortrait";
import type { EngravingProfile } from "@/presets/engravingProfile";
import { clampContrast, clampGamma } from "@/presets/default";

export type PreparePortraitResult = {
  /** Bild efter denoise/lokal kontrast (innan processImage-dither). */
  image: ImageData;
  normalize: boolean;
  contrast: number;
  gamma: number;
  /** Om true: bilden är redan binär — processImage ska hoppa över dither. */
  skipDither: boolean;
  applied: string[];
};

function cloneImageData(source: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(source.data),
    source.width,
    source.height,
  );
}

function luma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 3×3 median på luma, behåller kromatik proportionellt. */
function denoiseMedian(source: ImageData): ImageData {
  const { width, height, data } = source;
  const out = cloneImageData(source);
  const window: number[] = new Array(9);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const dst = (y * width + x) * 4;
      if (data[dst + 3]! < 8) continue;

      let k = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4;
          window[k++] = luma(data[i]!, data[i + 1]!, data[i + 2]!);
        }
      }
      window.sort((a, b) => a - b);
      const med = window[4]!;
      const old = luma(data[dst]!, data[dst + 1]!, data[dst + 2]!);
      if (old < 1) continue;
      const scale = med / old;
      out.data[dst] = Math.max(0, Math.min(255, Math.round(data[dst]! * scale)));
      out.data[dst + 1] = Math.max(
        0,
        Math.min(255, Math.round(data[dst + 1]! * scale)),
      );
      out.data[dst + 2] = Math.max(
        0,
        Math.min(255, Math.round(data[dst + 2]! * scale)),
      );
    }
  }
  return out;
}

/** Mild unsharp mask på luma. */
function localContrast(source: ImageData, amount = 0.35): ImageData {
  const { width, height, data } = source;
  const out = cloneImageData(source);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const dst = (y * width + x) * 4;
      if (data[dst + 3]! < 8) continue;

      let blur = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4;
          blur += luma(data[i]!, data[i + 1]!, data[i + 2]!);
        }
      }
      blur /= 9;
      const old = luma(data[dst]!, data[dst + 1]!, data[dst + 2]!);
      const sharpened = old + (old - blur) * amount;
      if (old < 1) continue;
      const scale = sharpened / old;
      out.data[dst] = Math.max(0, Math.min(255, Math.round(data[dst]! * scale)));
      out.data[dst + 1] = Math.max(
        0,
        Math.min(255, Math.round(data[dst + 1]! * scale)),
      );
      out.data[dst + 2] = Math.max(
        0,
        Math.min(255, Math.round(data[dst + 2]! * scale)),
      );
    }
  }
  return out;
}

/**
 * Villkorad ton/brus/lokal kontrast utifrån analys + profil.
 * Applicerar inte dither — det gör processImage en gång senare.
 */
export function preparePortrait(
  source: ImageData,
  analysis: PortraitAnalysis,
  _profile: EngravingProfile,
): PreparePortraitResult {
  const applied: string[] = [];

  if (analysis.likelyAlreadyBinary) {
    return {
      image: source,
      normalize: false,
      contrast: 1,
      gamma: 1,
      skipDither: true,
      applied: ["skip-dither:already-binary"],
    };
  }

  let image = source;

  if (analysis.suggestDenoise) {
    image = denoiseMedian(image);
    applied.push("denoise-median");
  }

  if (analysis.suggestLocalContrast) {
    image = localContrast(image);
    applied.push("local-contrast");
  }

  const normalize = analysis.suggestNormalize;
  if (normalize) applied.push("normalize-levels");

  const contrast = clampContrast(analysis.suggestedContrast);
  const gamma = clampGamma(analysis.suggestedGamma);
  if (contrast !== 1) applied.push(`contrast:${contrast}`);
  if (gamma !== 1) applied.push(`gamma:${gamma}`);

  return {
    image,
    normalize,
    contrast,
    gamma,
    skipDither: false,
    applied,
  };
}

/**
 * Avgör om bakgrundsborttagning ska köras för given profil + analys.
 */
export function shouldRemoveBackground(
  analysis: PortraitAnalysis,
  mode: EngravingProfile["prepare"]["removeBackground"] | boolean,
): boolean {
  if (mode === true || mode === "on") return true;
  if (mode === false || mode === "off") return false;
  return analysis.suggestRemoveBackground;
}
