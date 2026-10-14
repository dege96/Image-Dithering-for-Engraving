export type DitherAlgorithm =
  | "jarvis"
  | "atkinson"
  | "floydSteinberg"
  | "stucki"
  | "sierraLite"
  | "bayer4"
  | "bayer8"
  | "randomThreshold"
  | "blueNoise"
  | "halftone"
  | "threshold";

export type SettingsMode = "simple" | "advanced";

/** Tröskelspann — värden utanför används inte. */
export const MIN_THRESHOLD = 20;
export const MAX_THRESHOLD = 55;
export const DEFAULT_THRESHOLD = 50;

export const DEFAULT_ALGORITHM: DitherAlgorithm = "atkinson";
export const PREVIEW_MAX_SIZE = 1200;
export const CROP_PADDING = 12;
export const SLIDER_DEBOUNCE_MS = 75;
export const APP_VERSION = "1.0";

/** DPI för SVG-export (pixlar → mm). 254 = 10 px/mm. */
export const EXPORT_DPI = 254;

/** Max uppladdningsstorlek (bytes). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Kundstilar i enkelvy (algoritm + tröskel). */
export const CUSTOMER_STYLES = [
  {
    id: "klassisk",
    algorithm: "atkinson" as const,
    threshold: 50,
    label: "Klassisk",
    description: "Tydliga kanter med jämn gravyrton",
  },
  {
    id: "abstrakt",
    algorithm: "threshold" as const,
    threshold: 30,
    label: "Abstrakt",
    description: "Ren svartvit silhuett utan dither",
  },
  {
    id: "grynig",
    algorithm: "randomThreshold" as const,
    threshold: 38,
    label: "Grynig",
    description: "Kornig textur med mer liv i ytor",
  },
  {
    id: "halftone",
    algorithm: "halftone" as const,
    threshold: 35,
    label: "Halftone",
    description: "Klassiska tryckprickar för stiliserad gravyr",
  },
] as const;

export type CustomerStyle = (typeof CUSTOMER_STYLES)[number];
export type CustomerStyleId = CustomerStyle["id"];

const CUSTOMER_ALGORITHMS = new Set<DitherAlgorithm>(
  CUSTOMER_STYLES.map((s) => s.algorithm),
);

/** Ordning i avancerad dropdown (alla metoder). */
export const DITHER_ALGORITHMS: readonly DitherAlgorithm[] = [
  "jarvis",
  "atkinson",
  "floydSteinberg",
  "stucki",
  "sierraLite",
  "bayer4",
  "bayer8",
  "blueNoise",
  "halftone",
  "randomThreshold",
  "threshold",
] as const;

/** Metoder som bara syns under Avancerat (plus full lista där). */
export const ADVANCED_ONLY_ALGORITHMS: readonly DitherAlgorithm[] =
  DITHER_ALGORITHMS.filter((a) => !CUSTOMER_ALGORITHMS.has(a));

export function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_THRESHOLD;
  return Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, Math.round(value)));
}

export function customerStyleForPreset(
  algorithm: DitherAlgorithm,
  threshold: number,
): CustomerStyleId | null {
  const clamped = clampThreshold(threshold);
  const match = CUSTOMER_STYLES.find(
    (s) => s.algorithm === algorithm && s.threshold === clamped,
  );
  return match?.id ?? null;
}

export const ALGORITHM_LABELS: Record<DitherAlgorithm, string> = {
  jarvis: "Jarvis–Judice–Ninke",
  atkinson: "Atkinson",
  floydSteinberg: "Floyd–Steinberg",
  stucki: "Stucki",
  sierraLite: "Sierra Lite",
  bayer4: "Bayer 4×4",
  bayer8: "Bayer 8×8",
  blueNoise: "Blue Noise",
  halftone: "Halftone",
  randomThreshold: "Random Threshold",
  threshold: "Threshold",
};

/** Konvertera pixlar till mm vid given DPI. */
export function pixelsToMm(pixels: number, dpi: number = EXPORT_DPI): number {
  return (pixels / dpi) * 25.4;
}

/** Beräkna exportstorlek i mm (bredd-override behåller proportioner). */
export function exportSizeMm(
  widthPx: number,
  heightPx: number,
  options?: { widthMm?: number; dpi?: number },
): { widthMm: number; heightMm: number; dpi: number } {
  const dpi = options?.dpi ?? EXPORT_DPI;
  if (options?.widthMm != null && options.widthMm > 0 && widthPx > 0) {
    const widthMm = options.widthMm;
    const heightMm = widthMm * (heightPx / widthPx);
    return { widthMm, heightMm, dpi };
  }
  return {
    widthMm: pixelsToMm(widthPx, dpi),
    heightMm: pixelsToMm(heightPx, dpi),
    dpi,
  };
}
