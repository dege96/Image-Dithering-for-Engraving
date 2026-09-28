export type DitherAlgorithm = "jarvis" | "atkinson" | "threshold";

export type ViewMode = "gravyr" | "original";

export const DEFAULT_THRESHOLD = 50;
export const DEFAULT_ALGORITHM: DitherAlgorithm = "jarvis";
export const PREVIEW_MAX_SIZE = 1200;
export const CROP_PADDING = 12;
export const SLIDER_DEBOUNCE_MS = 75;
export const APP_VERSION = "1.0";

export const ALGORITHM_LABELS: Record<DitherAlgorithm, string> = {
  jarvis: "JARVIS",
  atkinson: "ATKINSON",
  threshold: "THRESHOLD",
};
