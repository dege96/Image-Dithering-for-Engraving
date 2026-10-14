"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DitherSelector } from "@/components/DitherSelector";
import { ExportButton } from "@/components/ExportButton";
import { ExportSvgButton } from "@/components/ExportSvgButton";
import { GrainSlider } from "@/components/GrainSlider";
import { HalftoneDensitySlider } from "@/components/HalftoneDensitySlider";
import { ImagePreview } from "@/components/ImagePreview";
import { ImageUploader } from "@/components/ImageUploader";
import { QuoteButton } from "@/components/QuoteButton";
import { NormalizeLevelsToggle } from "@/components/NormalizeLevelsToggle";
import { RemoveBackgroundToggle } from "@/components/RemoveBackgroundToggle";
import { SettingsModeToggle } from "@/components/SettingsModeToggle";
import { StylePicker } from "@/components/StylePicker";
import { ThresholdSlider } from "@/components/ThresholdSlider";
import { ToneControls } from "@/components/ToneControls";
import { Button } from "@/components/ui/button";
import { downloadBlob, exportPNG } from "@/export/exportPNG";
import { exportSVG } from "@/export/exportSVG";
import { cropToContent } from "@/image/cropToContent";
import {
  imageDataToObjectUrl,
  imageToImageData,
  loadImage,
} from "@/image/loadImage";
import { processImageAsync } from "@/image/processImageClient";
import { removeBackground } from "@/image/removeBackground";
import { messageForError } from "@/lib/errors";
import {
  getQuoteUrl,
  isInternalQuoteUrl,
  saveQuoteSession,
} from "@/lib/quote";
import {
  CUSTOMER_STYLES,
  DEFAULT_ALGORITHM,
  DEFAULT_CONTRAST,
  DEFAULT_GAMMA,
  DEFAULT_HALFTONE_CELL_SCALE,
  DEFAULT_NOISE_AMPLITUDE,
  DEFAULT_THRESHOLD,
  EXPORT_DPI,
  PREVIEW_MAX_SIZE,
  SLIDER_DEBOUNCE_MS,
  clampContrast,
  clampGamma,
  clampHalftoneCellScale,
  clampNoiseAmplitude,
  clampThreshold,
  exportSizeMm,
  type CustomerStyle,
  type DitherAlgorithm,
  type SettingsMode,
} from "@/presets/default";

type AppState = {
  originalImage: ImageData | null;
  bgRemovedImage: ImageData | null;
  foregroundImage: ImageData | null;
  algorithm: DitherAlgorithm;
  threshold: number;
  contrast: number;
  gamma: number;
  halftoneCellScale: number;
  noiseAmplitude: number;
  removeBackgroundEnabled: boolean;
  normalizeLevelsEnabled: boolean;
  isPreparing: boolean;
  isProcessing: boolean;
  isExporting: boolean;
  isExportingSvg: boolean;
  isPreparingQuote: boolean;
  settingsMode: SettingsMode;
  error: string | null;
  exportNotice: string | null;
};

const initialState: AppState = {
  originalImage: null,
  bgRemovedImage: null,
  foregroundImage: null,
  algorithm: DEFAULT_ALGORITHM,
  threshold: DEFAULT_THRESHOLD,
  contrast: DEFAULT_CONTRAST,
  gamma: DEFAULT_GAMMA,
  halftoneCellScale: DEFAULT_HALFTONE_CELL_SCALE,
  noiseAmplitude: DEFAULT_NOISE_AMPLITUDE,
  removeBackgroundEnabled: false,
  normalizeLevelsEnabled: false,
  isPreparing: false,
  isProcessing: false,
  isExporting: false,
  isExportingSvg: false,
  isPreparingQuote: false,
  settingsMode: "simple",
  error: null,
  exportNotice: null,
};

export function GravyrApp() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(initialState);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [prepareLabel, setPrepareLabel] = useState("Förbereder din bild…");
  const requestId = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceFileRef = useRef<File | null>(null);
  const bgCacheRef = useRef<ImageData | null>(null);
  const removeBgEnabledRef = useRef(false);
  const originalUrlRef = useRef<string | null>(null);
  const processedUrlRef = useRef<string | null>(null);
  const algorithmRef = useRef(state.algorithm);
  const thresholdRef = useRef(state.threshold);
  const normalizeRef = useRef(state.normalizeLevelsEnabled);
  const contrastRef = useRef(state.contrast);
  const gammaRef = useRef(state.gamma);
  const halftoneCellScaleRef = useRef(state.halftoneCellScale);
  const noiseAmplitudeRef = useRef(state.noiseAmplitude);
  const foregroundRef = useRef<ImageData | null>(null);

  algorithmRef.current = state.algorithm;
  thresholdRef.current = state.threshold;
  normalizeRef.current = state.normalizeLevelsEnabled;
  contrastRef.current = state.contrast;
  gammaRef.current = state.gamma;
  halftoneCellScaleRef.current = state.halftoneCellScale;
  noiseAmplitudeRef.current = state.noiseAmplitude;
  foregroundRef.current = state.foregroundImage;

  const processExtras = () => ({
    normalize: normalizeRef.current,
    contrast: contrastRef.current,
    gamma: gammaRef.current,
    halftoneCellScale: halftoneCellScaleRef.current,
    noiseAmplitude: noiseAmplitudeRef.current,
  });

  const revoke = (url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  };

  const setOriginalUrlSafe = useCallback((url: string | null) => {
    revoke(originalUrlRef.current);
    originalUrlRef.current = url;
    setOriginalUrl(url);
  }, []);

  const setProcessedUrlSafe = useCallback((url: string | null) => {
    revoke(processedUrlRef.current);
    processedUrlRef.current = url;
    setProcessedUrl(url);
  }, []);

  const reset = (keepToggle = true) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestId.current += 1;
    setOriginalUrlSafe(null);
    setProcessedUrlSafe(null);
    sourceFileRef.current = null;
    bgCacheRef.current = null;
    setState((s) => ({
      ...initialState,
      removeBackgroundEnabled: keepToggle
        ? s.removeBackgroundEnabled
        : false,
      normalizeLevelsEnabled: keepToggle
        ? s.normalizeLevelsEnabled
        : false,
    }));
  };

  const runProcess = useCallback(
    async (
      foreground: ImageData,
      algorithm: DitherAlgorithm,
      threshold: number,
      extras = processExtras(),
    ) => {
      const id = ++requestId.current;
      const clamped = clampThreshold(threshold);
      setState((s) => ({ ...s, isProcessing: true, error: null }));
      try {
        const result = await processImageAsync(foreground, {
          algorithm,
          threshold: clamped,
          maxSize: PREVIEW_MAX_SIZE,
          ...extras,
        });
        if (id !== requestId.current) return;
        const url = await imageDataToObjectUrl(result);
        setProcessedUrlSafe(url);
        setState((s) => ({
          ...s,
          isProcessing: false,
        }));
      } catch (err) {
        if (id !== requestId.current) return;
        setState((s) => ({
          ...s,
          isProcessing: false,
          error: messageForError(
            err instanceof Error && err.message === "PROCESS_FAIL"
              ? err
              : new Error("PROCESS_FAIL"),
          ),
        }));
      }
    },
    [setProcessedUrlSafe],
  );

  const scheduleProcess = useCallback(
    (
      foreground: ImageData,
      algorithm: DitherAlgorithm,
      threshold: number,
      immediate = false,
      extras = processExtras(),
    ) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (immediate) {
        void runProcess(foreground, algorithm, threshold, extras);
        return;
      }
      debounceRef.current = setTimeout(() => {
        void runProcess(foreground, algorithm, threshold, extras);
      }, SLIDER_DEBOUNCE_MS);
    },
    [runProcess],
  );

  const ensureBgRemoved = useCallback(async (file: File): Promise<ImageData> => {
    if (bgCacheRef.current) {
      return bgCacheRef.current;
    }
    setPrepareLabel("Tar bort bakgrund…");
    const withoutBg = await removeBackground(file);
    const cropped = cropToContent(withoutBg);
    bgCacheRef.current = cropped;
    return cropped;
  }, []);

  const handleFile = async (file: File) => {
    const enabled = removeBgEnabledRef.current;
    reset(true);
    removeBgEnabledRef.current = enabled;
    sourceFileRef.current = file;
    bgCacheRef.current = null;

    setState((s) => ({
      ...s,
      removeBackgroundEnabled: enabled,
      isPreparing: true,
      error: null,
      exportNotice: null,
    }));
    setPrepareLabel("Förbereder din bild…");

    try {
      const img = await loadImage(file);
      const original = imageToImageData(img);
      const origUrl = await imageDataToObjectUrl(original);
      setOriginalUrlSafe(origUrl);

      let foreground: ImageData = original;
      let bgRemoved: ImageData | null = null;

      if (enabled) {
        bgRemoved = await ensureBgRemoved(file);
        foreground = bgRemoved;
      }

      const defaultStyle = CUSTOMER_STYLES[0];

      setState((s) => ({
        ...s,
        originalImage: original,
        bgRemovedImage: bgRemoved,
        foregroundImage: foreground,
        algorithm: defaultStyle.algorithm,
        threshold: defaultStyle.threshold,
        removeBackgroundEnabled: enabled,
        isPreparing: false,
      }));

      await runProcess(
        foreground,
        defaultStyle.algorithm,
        defaultStyle.threshold,
      );
    } catch (err) {
      setState((s) => ({
        ...s,
        isPreparing: false,
        isProcessing: false,
        error: messageForError(err),
      }));
    }
  };

  const setRemoveBackgroundEnabled = async (enabled: boolean) => {
    removeBgEnabledRef.current = enabled;
    setState((s) => ({ ...s, removeBackgroundEnabled: enabled, error: null }));

    const original = state.originalImage;
    if (!original) return;

    if (!enabled) {
      setState((s) => ({
        ...s,
        foregroundImage: original,
        removeBackgroundEnabled: false,
      }));
      scheduleProcess(original, algorithmRef.current, thresholdRef.current, true);
      return;
    }

    const file = sourceFileRef.current;
    if (!file) {
      setState((s) => ({
        ...s,
        error: messageForError(new Error("PROCESS_FAIL")),
      }));
      return;
    }

    if (bgCacheRef.current || state.bgRemovedImage) {
      const cached = bgCacheRef.current ?? state.bgRemovedImage!;
      bgCacheRef.current = cached;
      setState((s) => ({
        ...s,
        bgRemovedImage: cached,
        foregroundImage: cached,
        removeBackgroundEnabled: true,
      }));
      scheduleProcess(cached, algorithmRef.current, thresholdRef.current, true);
      return;
    }

    const id = ++requestId.current;
    setState((s) => ({ ...s, isPreparing: true, error: null }));
    setPrepareLabel("Tar bort bakgrund…");
    try {
      const bgRemoved = await ensureBgRemoved(file);
      if (id !== requestId.current) return;
      setState((s) => ({
        ...s,
        bgRemovedImage: bgRemoved,
        foregroundImage: bgRemoved,
        removeBackgroundEnabled: true,
        isPreparing: false,
      }));
      await runProcess(bgRemoved, algorithmRef.current, thresholdRef.current);
    } catch (err) {
      if (id !== requestId.current) return;
      removeBgEnabledRef.current = false;
      setState((s) => ({
        ...s,
        removeBackgroundEnabled: false,
        foregroundImage: original,
        isPreparing: false,
        error: messageForError(err),
      }));
    }
  };

  const applyStyle = (style: CustomerStyle) => {
    setState((s) => ({
      ...s,
      algorithm: style.algorithm,
      threshold: style.threshold,
    }));
    const foreground = foregroundRef.current;
    if (foreground) {
      scheduleProcess(foreground, style.algorithm, style.threshold, true);
    }
  };

  const setAlgorithm = (algorithm: DitherAlgorithm) => {
    setState((s) => ({ ...s, algorithm }));
    const foreground = foregroundRef.current;
    if (foreground) {
      scheduleProcess(foreground, algorithm, thresholdRef.current, true);
    }
  };

  const setThreshold = (threshold: number) => {
    const clamped = clampThreshold(threshold);
    setState((s) => ({ ...s, threshold: clamped }));
    const foreground = foregroundRef.current;
    if (foreground) {
      scheduleProcess(foreground, algorithmRef.current, clamped);
    }
  };

  const setNormalizeLevelsEnabled = (enabled: boolean) => {
    normalizeRef.current = enabled;
    setState((s) => ({ ...s, normalizeLevelsEnabled: enabled }));
    const foreground = foregroundRef.current;
    if (foreground) {
      scheduleProcess(foreground, algorithmRef.current, thresholdRef.current, true, {
        ...processExtras(),
        normalize: enabled,
      });
    }
  };

  const setContrast = (contrast: number) => {
    const clamped = clampContrast(contrast);
    contrastRef.current = clamped;
    setState((s) => ({ ...s, contrast: clamped }));
    const foreground = foregroundRef.current;
    if (foreground) {
      scheduleProcess(foreground, algorithmRef.current, thresholdRef.current);
    }
  };

  const setGamma = (gamma: number) => {
    const clamped = clampGamma(gamma);
    gammaRef.current = clamped;
    setState((s) => ({ ...s, gamma: clamped }));
    const foreground = foregroundRef.current;
    if (foreground) {
      scheduleProcess(foreground, algorithmRef.current, thresholdRef.current);
    }
  };

  const setHalftoneCellScale = (halftoneCellScale: number) => {
    const clamped = clampHalftoneCellScale(halftoneCellScale);
    halftoneCellScaleRef.current = clamped;
    setState((s) => ({ ...s, halftoneCellScale: clamped }));
    const foreground = foregroundRef.current;
    if (foreground) {
      scheduleProcess(foreground, algorithmRef.current, thresholdRef.current);
    }
  };

  const setNoiseAmplitude = (noiseAmplitude: number) => {
    const clamped = clampNoiseAmplitude(noiseAmplitude);
    noiseAmplitudeRef.current = clamped;
    setState((s) => ({ ...s, noiseAmplitude: clamped }));
    const foreground = foregroundRef.current;
    if (foreground) {
      scheduleProcess(foreground, algorithmRef.current, thresholdRef.current);
    }
  };

  const handleExport = async () => {
    if (!state.foregroundImage) return;
    setState((s) => ({ ...s, isExporting: true, error: null, exportNotice: null }));
    try {
      const { blob, filename } = await exportPNG(
        state.foregroundImage,
        state.algorithm,
        state.threshold,
        {
          normalize: state.normalizeLevelsEnabled,
          contrast: state.contrast,
          gamma: state.gamma,
          halftoneCellScale: state.halftoneCellScale,
          noiseAmplitude: state.noiseAmplitude,
        },
      );
      downloadBlob(blob, filename);
      setState((s) => ({
        ...s,
        isExporting: false,
        exportNotice: `PNG sparad: ${filename}`,
      }));
    } catch {
      setState((s) => ({
        ...s,
        isExporting: false,
        error: messageForError(new Error("EXPORT_FAIL")),
      }));
    }
  };

  const handleExportSvg = async () => {
    if (!state.foregroundImage) return;
    setState((s) => ({
      ...s,
      isExportingSvg: true,
      error: null,
      exportNotice: null,
    }));
    try {
      const { blob, filename } = await exportSVG(
        state.foregroundImage,
        state.algorithm,
        state.threshold,
        {
          normalize: state.normalizeLevelsEnabled,
          contrast: state.contrast,
          gamma: state.gamma,
          halftoneCellScale: state.halftoneCellScale,
          noiseAmplitude: state.noiseAmplitude,
        },
      );
      downloadBlob(blob, filename);
      const size = exportSizeMm(
        state.foregroundImage.width,
        state.foregroundImage.height,
      );
      setState((s) => ({
        ...s,
        isExportingSvg: false,
        exportNotice: `SVG sparad: ${filename} (${size.widthMm.toFixed(1)} × ${size.heightMm.toFixed(1)} mm @ ${EXPORT_DPI} DPI)`,
      }));
    } catch {
      setState((s) => ({
        ...s,
        isExportingSvg: false,
        error: messageForError(new Error("EXPORT_SVG_FAIL")),
      }));
    }
  };

  const handleQuote = async () => {
    if (!state.foregroundImage) return;
    setState((s) => ({
      ...s,
      isPreparingQuote: true,
      error: null,
      exportNotice: null,
    }));
    try {
      const { blob, filename, metadata } = await exportPNG(
        state.foregroundImage,
        state.algorithm,
        state.threshold,
        {
          normalize: state.normalizeLevelsEnabled,
          contrast: state.contrast,
          gamma: state.gamma,
          halftoneCellScale: state.halftoneCellScale,
          noiseAmplitude: state.noiseAmplitude,
        },
      );
      downloadBlob(blob, filename);
      saveQuoteSession({
        filename,
        algorithm: metadata.algorithm,
        threshold: metadata.threshold,
        preparedAt: new Date().toISOString(),
      });

      const quoteUrl = getQuoteUrl();
      if (isInternalQuoteUrl(quoteUrl)) {
        router.push("/offert");
      } else {
        window.open(quoteUrl, "_blank", "noopener,noreferrer");
      }
      setState((s) => ({
        ...s,
        isPreparingQuote: false,
        exportNotice:
          "PNG nedladdad. Fortsätt på offertsidan och bifoga filen i mejlet.",
      }));
    } catch {
      setState((s) => ({
        ...s,
        isPreparingQuote: false,
        error: messageForError(new Error("EXPORT_FAIL")),
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      revoke(originalUrlRef.current);
      revoke(processedUrlRef.current);
    };
  }, []);

  const hasImage = Boolean(state.originalImage || state.foregroundImage);
  const busy =
    state.isPreparing ||
    state.isProcessing ||
    state.isExporting ||
    state.isExportingSvg ||
    state.isPreparingQuote;
  const isSimple = state.settingsMode === "simple";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
      {!hasImage && !state.isPreparing && (
        <ImageUploader disabled={busy} onFile={handleFile} />
      )}

      {(hasImage || state.isPreparing) && (
        <>
          <ImagePreview
            src={state.isPreparing ? originalUrl : processedUrl}
            alt={
              state.isPreparing
                ? "Uppladdad bild"
                : "Förhandsvisning av lasergravyr"
            }
            isProcessing={state.isPreparing || state.isProcessing}
            footer={
              hasImage ? (
                <ThresholdSlider
                  variant="glass"
                  value={state.threshold}
                  onChange={setThreshold}
                  disabled={busy}
                />
              ) : null
            }
          />

          {state.isPreparing && (
            <p className="text-center text-sm text-muted-foreground" aria-live="polite">
              {prepareLabel}
            </p>
          )}

          {hasImage && (
            <div className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SettingsModeToggle
                  value={state.settingsMode}
                  onChange={(settingsMode) =>
                    setState((s) => ({ ...s, settingsMode }))
                  }
                  disabled={busy}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => reset(true)}
                  disabled={
                    state.isExporting ||
                    state.isExportingSvg ||
                    state.isPreparingQuote
                  }
                >
                  Välj ny bild
                </Button>
              </div>

              {isSimple ? (
                <StylePicker
                  algorithm={state.algorithm}
                  threshold={state.threshold}
                  onSelect={applyStyle}
                  disabled={busy}
                />
              ) : (
                <div className="space-y-4">
                  <RemoveBackgroundToggle
                    checked={state.removeBackgroundEnabled}
                    onCheckedChange={(v) => {
                      void setRemoveBackgroundEnabled(v);
                    }}
                    disabled={busy}
                  />

                  <NormalizeLevelsToggle
                    checked={state.normalizeLevelsEnabled}
                    onCheckedChange={setNormalizeLevelsEnabled}
                    disabled={busy}
                  />

                  <DitherSelector
                    value={state.algorithm}
                    onChange={setAlgorithm}
                    disabled={busy}
                    label="Teknisk algoritm"
                  />

                  <ToneControls
                    contrast={state.contrast}
                    gamma={state.gamma}
                    onContrastChange={setContrast}
                    onGammaChange={setGamma}
                    disabled={busy}
                  />

                  {state.algorithm === "halftone" && (
                    <HalftoneDensitySlider
                      value={state.halftoneCellScale}
                      onChange={setHalftoneCellScale}
                      disabled={busy}
                    />
                  )}

                  {state.algorithm === "randomThreshold" && (
                    <GrainSlider
                      value={state.noiseAmplitude}
                      onChange={setNoiseAmplitude}
                      disabled={busy}
                    />
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <ExportButton
                      onClick={handleExport}
                      disabled={!state.foregroundImage || state.isPreparing}
                      isExporting={state.isExporting}
                    />
                    <ExportSvgButton
                      onClick={handleExportSvg}
                      disabled={!state.foregroundImage || state.isPreparing}
                      isExporting={state.isExportingSvg}
                    />
                  </div>
                </div>
              )}

              <QuoteButton
                onClick={() => {
                  void handleQuote();
                }}
                disabled={!state.foregroundImage || state.isPreparing}
                isPreparing={state.isPreparingQuote}
              />

              {state.exportNotice && (
                <p
                  className="text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  {state.exportNotice}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <p>{state.error}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => reset(true)}
          >
            Välj ny bild
          </Button>
        </div>
      )}
    </div>
  );
}
