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

export type ViewMode = "gravyr" | "original";

/** Tröskelspann — värden utanför används inte. */
export const MIN_THRESHOLD = 20;
export const MAX_THRESHOLD = 55;
export const DEFAULT_THRESHOLD = 50;

export const DEFAULT_ALGORITHM: DitherAlgorithm = "jarvis";
export const PREVIEW_MAX_SIZE = 1200;
export const CROP_PADDING = 12;
export const SLIDER_DEBOUNCE_MS = 75;
export const APP_VERSION = "1.0";

/** Ordning i dropdown. */
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

export function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_THRESHOLD;
  return Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, Math.round(value)));
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
