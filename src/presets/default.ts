export type DitherAlgorithm = "jarvis" | "atkinson" | "threshold";

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

export function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_THRESHOLD;
  return Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, Math.round(value)));
}

export const ALGORITHM_LABELS: Record<DitherAlgorithm, string> = {
  jarvis: "JARVIS",
  atkinson: "ATKINSON",
  threshold: "THRESHOLD",
};
