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
import { NormalizeLevelsToggle } from "@/components/NormalizeLevelsToggle";
import { PrepareImageDialog } from "@/components/PrepareImageDialog";
import { QuoteButton } from "@/components/QuoteButton";
import { SettingsModeToggle } from "@/components/SettingsModeToggle";
import { SizeMmControl } from "@/components/SizeMmControl";
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
  SLIDER_DEBOUNCE_MS,
  clampContrast,
  clampGamma,
  clampHalftoneCellScale,
  clampNoiseAmplitude,
  clampThreshold,
  type CustomerStyle,
  type CustomerStyleId,
  type DitherAlgorithm,
  type SettingsMode,
} from "@/presets/default";
import { DEFAULT_ENGRAVING_PROFILE } from "@/presets/engravingProfile";

const PROFILE = DEFAULT_ENGRAVING_PROFILE;

type AppPhase = "idle" | "prepare" | "ready";

type AppState = {
  phase: AppPhase;
  originalImage: ImageData | null;
  bgRemovedImage: ImageData | null;
  /** Oditherad källa efter prepare (cache). */
  foregroundImage: ImageData | null;
  algorithm: DitherAlgorithm;
  threshold: number;
  contrast: number;
  gamma: number;
  halftoneCellScale: number;
  noiseAmplitude: number;
  removeBackgroundEnabled: boolean;
  normalizeLevelsEnabled: boolean;
  skipDither: boolean;
  widthMm: number;
  activeStyleId: CustomerStyleId | null;
  prepareNote: string | null;
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
  phase: "idle",
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
  skipDither: false,
  widthMm: PROFILE.physical.defaultWidthMm,
  activeStyleId: "klassisk",
  prepareNote: null,
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
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [prepareLabel, setPrepareLabel] = useState("Förbereder din bild…");
  const requestId = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceFileRef = useRef<File | null>(null);
  const bgCacheRef = useRef<ImageData | null>(null);
  const removeBgEnabledRef = useRef(false);
  const originalUrlRef = useRef<string | null>(null);
  const bgRemovedUrlRef = useRef<string | null>(null);
  const processedUrlRef = useRef<string | null>(null);
  const algorithmRef = useRef(state.algorithm);
  const thresholdRef = useRef(state.threshold);
  const normalizeRef = useRef(state.normalizeLevelsEnabled);
  const contrastRef = useRef(state.contrast);
  const gammaRef = useRef(state.gamma);
  const halftoneCellScaleRef = useRef(state.halftoneCellScale);
  const noiseAmplitudeRef = useRef(state.noiseAmplitude);
  const skipDitherRef = useRef(state.skipDither);
  const foregroundRef = useRef<ImageData | null>(null);
  const originalRef = useRef<ImageData | null>(null);

  algorithmRef.current = state.algorithm;
  thresholdRef.current = state.threshold;
  normalizeRef.current = state.normalizeLevelsEnabled;
  contrastRef.current = state.contrast;
  gammaRef.current = state.gamma;
  halftoneCellScaleRef.current = state.halftoneCellScale;
  noiseAmplitudeRef.current = state.noiseAmplitude;
  skipDitherRef.current = state.skipDither;
  foregroundRef.current = state.foregroundImage;
  originalRef.current = state.originalImage;

  const processExtras = () => ({
    normalize: normalizeRef.current,
    contrast: contrastRef.current,
    gamma: gammaRef.current,
    halftoneCellScale: halftoneCellScaleRef.current,
    noiseAmplitude: noiseAmplitudeRef.current,
    skipDither: skipDitherRef.current,
    maxSize: PROFILE.raster.maxSize,
  });

  const revoke = (url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  };

  const setOriginalUrlSafe = useCallback((url: string | null) => {
    revoke(originalUrlRef.current);
    originalUrlRef.current = url;
    setOriginalUrl(url);
  }, []);

  const setBgRemovedUrlSafe = useCallback((url: string | null) => {
    revoke(bgRemovedUrlRef.current);
    bgRemovedUrlRef.current = url;
    setBgRemovedUrl(url);
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
    setBgRemovedUrlSafe(null);
    setProcessedUrlSafe(null);
    sourceFileRef.current = null;
    bgCacheRef.current = null;
    setState((s) => ({
      ...initialState,
      widthMm: s.widthMm,
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
          ...extras,
          maxSize: PROFILE.raster.maxSize,
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

  /** Valfri BG-borttagning. Returnerar oditherad foreground + aktuella params. */
  const buildForeground = async (
    file: File,
    original: ImageData,
    wantBg: boolean,
  ) => {
    let base: ImageData = original;
    let bgRemoved: ImageData | null = null;

    if (wantBg) {
      bgRemoved = await ensureBgRemoved(file);
      base = bgRemoved;
    }

    return {
      foreground: base,
      bgRemoved,
      removeBackgroundEnabled: wantBg,
      normalize: normalizeRef.current,
      contrast: contrastRef.current,
      gamma: gammaRef.current,
      skipDither: false,
      prepareNote: null as string | null,
    };
  };

  const handleFile = async (file: File) => {
    reset(false);
    removeBgEnabledRef.current = false;
    sourceFileRef.current = file;
    bgCacheRef.current = null;

    const defaultStyle = CUSTOMER_STYLES[0]!;

    setState((s) => ({
      ...s,
      phase: "prepare",
      activeStyleId: defaultStyle.id,
      algorithm: defaultStyle.algorithm,
      threshold: defaultStyle.threshold,
      removeBackgroundEnabled: false,
      isPreparing: true,
      error: null,
      exportNotice: null,
      prepareNote: null,
    }));
    setPrepareLabel("Laddar bild…");

    try {
      const img = await loadImage(file);
      const original = imageToImageData(img);
      const origUrl = await imageDataToObjectUrl(original);
      setOriginalUrlSafe(origUrl);
      setBgRemovedUrlSafe(null);

      setState((s) => ({
        ...s,
        phase: "prepare",
        originalImage: original,
        bgRemovedImage: null,
        foregroundImage: original,
        removeBackgroundEnabled: false,
        isPreparing: false,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        phase: "idle",
        isPreparing: false,
        error: messageForError(err),
      }));
    }
  };

  /** Växlar endast källbild i prepare-dialogen — dither körs efter Klar. */
  const setRemoveBackgroundEnabled = async (enabled: boolean) => {
    removeBgEnabledRef.current = enabled;

    const original = originalRef.current ?? state.originalImage;
    const file = sourceFileRef.current;
    if (!original || !file) {
      setState((s) => ({ ...s, removeBackgroundEnabled: enabled }));
      return;
    }

    if (!enabled) {
      setState((s) => ({
        ...s,
        removeBackgroundEnabled: false,
        foregroundImage: original,
        error: null,
      }));
      return;
    }

    if (bgCacheRef.current && bgRemovedUrlRef.current) {
      setState((s) => ({
        ...s,
        removeBackgroundEnabled: true,
        bgRemovedImage: bgCacheRef.current,
        foregroundImage: bgCacheRef.current,
        error: null,
      }));
      return;
    }

    const id = ++requestId.current;
    setState((s) => ({
      ...s,
      removeBackgroundEnabled: true,
      isPreparing: true,
      error: null,
    }));
    setPrepareLabel("Tar bort bakgrund…");

    try {
      const bgRemoved = await ensureBgRemoved(file);
      if (id !== requestId.current) return;

      const bgUrl = await imageDataToObjectUrl(bgRemoved);
      if (id !== requestId.current) return;
      setBgRemovedUrlSafe(bgUrl);

      setState((s) => ({
        ...s,
        bgRemovedImage: bgRemoved,
        foregroundImage: bgRemoved,
        removeBackgroundEnabled: true,
        isPreparing: false,
      }));
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

  const confirmPrepare = async () => {
    const original = originalRef.current ?? state.originalImage;
    const foreground = removeBgEnabledRef.current
      ? (bgCacheRef.current ?? state.bgRemovedImage ?? original)
      : original;
    if (!foreground) return;

    const defaultStyle =
      CUSTOMER_STYLES.find((s) => s.id === state.activeStyleId) ??
      CUSTOMER_STYLES[0]!;

    setState((s) => ({
      ...s,
      phase: "ready",
      foregroundImage: foreground,
      algorithm: defaultStyle.algorithm,
      threshold: defaultStyle.threshold,
      activeStyleId: defaultStyle.id,
      error: null,
      exportNotice: null,
    }));

    await runProcess(
      foreground,
      defaultStyle.algorithm,
      defaultStyle.threshold,
      {
        ...processExtras(),
        maxSize: PROFILE.raster.maxSize,
      },
    );
  };

  const applyStyle = async (style: CustomerStyle) => {
    const file = sourceFileRef.current;
    const original = originalRef.current;
    if (!file || !original) {
      setState((s) => ({
        ...s,
        algorithm: style.algorithm,
        threshold: style.threshold,
        activeStyleId: style.id,
        skipDither: false,
      }));
      return;
    }

    const id = ++requestId.current;
    setState((s) => ({
      ...s,
      algorithm: style.algorithm,
      threshold: style.threshold,
      activeStyleId: style.id,
      isPreparing: true,
      error: null,
    }));
    setPrepareLabel("Byter stil…");

    try {
      const built = await buildForeground(
        file,
        original,
        removeBgEnabledRef.current,
      );
      if (id !== requestId.current) return;

      normalizeRef.current = built.normalize;
      contrastRef.current = built.contrast;
      gammaRef.current = built.gamma;
      skipDitherRef.current = built.skipDither;
      removeBgEnabledRef.current = built.removeBackgroundEnabled;

      if (built.bgRemoved) {
        const bgUrl = await imageDataToObjectUrl(built.bgRemoved);
        if (id !== requestId.current) return;
        setBgRemovedUrlSafe(bgUrl);
      } else {
        setBgRemovedUrlSafe(null);
      }

      setState((s) => ({
        ...s,
        bgRemovedImage: built.bgRemoved,
        foregroundImage: built.foreground,
        algorithm: style.algorithm,
        threshold: style.threshold,
        activeStyleId: style.id,
        normalizeLevelsEnabled: built.normalize,
        contrast: built.contrast,
        gamma: built.gamma,
        skipDither: built.skipDither,
        removeBackgroundEnabled: built.removeBackgroundEnabled,
        prepareNote: built.prepareNote,
        isPreparing: false,
      }));

      await runProcess(built.foreground, style.algorithm, style.threshold, {
        normalize: built.normalize,
        contrast: built.contrast,
        gamma: built.gamma,
        skipDither: built.skipDither,
        halftoneCellScale: halftoneCellScaleRef.current,
        noiseAmplitude: noiseAmplitudeRef.current,
        maxSize: PROFILE.raster.maxSize,
      });
    } catch (err) {
      if (id !== requestId.current) return;
      setState((s) => ({
        ...s,
        isPreparing: false,
        error: messageForError(err),
      }));
    }
  };

  const setAlgorithm = (algorithm: DitherAlgorithm) => {
    setState((s) => ({ ...s, algorithm, activeStyleId: null }));
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

  const exportOpts = () => ({
    normalize: state.normalizeLevelsEnabled,
    contrast: state.contrast,
    gamma: state.gamma,
    halftoneCellScale: state.halftoneCellScale,
    noiseAmplitude: state.noiseAmplitude,
    maxSize: PROFILE.raster.maxSize,
    skipDither: state.skipDither,
    widthMm: state.widthMm,
    profile: PROFILE,
  });

  const handleExport = async () => {
    if (!state.foregroundImage) return;
    setState((s) => ({ ...s, isExporting: true, error: null, exportNotice: null }));
    try {
      const { blob, filename } = await exportPNG(
        state.foregroundImage,
        state.algorithm,
        state.threshold,
        exportOpts(),
      );
      downloadBlob(blob, filename);
      setState((s) => ({
        ...s,
        isExporting: false,
        exportNotice: `PNG sparad: ${filename} (${PROFILE.raster.maxSize}px max — samma som förhandsvisning)`,
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
      const { blob, filename, widthMm, heightMm, dpi, widthPx, heightPx } =
        await exportSVG(
          state.foregroundImage,
          state.algorithm,
          state.threshold,
          exportOpts(),
        );
      downloadBlob(blob, filename);
      setState((s) => ({
        ...s,
        isExportingSvg: false,
        exportNotice: `SVG sparad: ${filename} (${widthMm.toFixed(1)} × ${heightMm.toFixed(1)} mm, ${widthPx}×${heightPx} px @ ${Math.round(dpi)} DPI effektiv)`,
      }));
    } catch {
      setState((s) => ({
        ...s,
        isExportingSvg: false,
        error: messageForError(new Error("EXPORT_SVG_FAIL")),
      }));
    }
  };

  const setWidthMm = (widthMm: number) => {
    setState((s) => ({ ...s, widthMm }));
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
      // Offert använder alltid pixel-PNG för stabil kundfil
      const { blob, filename, metadata } = await exportPNG(
        state.foregroundImage,
        state.algorithm,
        state.threshold,
        exportOpts(),
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
      revoke(bgRemovedUrlRef.current);
      revoke(processedUrlRef.current);
    };
  }, []);

  const isPrepare = state.phase === "prepare";
  const isReady = state.phase === "ready";
  const busy =
    state.isPreparing ||
    state.isProcessing ||
    state.isExporting ||
    state.isExportingSvg ||
    state.isPreparingQuote;
  const isSimple = state.settingsMode === "simple";
  const exportDisabled = !state.foregroundImage || state.isPreparing;
  const preparePreviewSrc = state.removeBackgroundEnabled
    ? (bgRemovedUrl ?? originalUrl)
    : originalUrl;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
      {state.phase === "idle" && (
        <ImageUploader disabled={busy} onFile={handleFile} />
      )}

      <PrepareImageDialog
        open={isPrepare}
        imageSrc={preparePreviewSrc}
        removeBackgroundEnabled={state.removeBackgroundEnabled}
        isBusy={state.isPreparing}
        statusLabel={state.isPreparing ? prepareLabel : null}
        onRemoveBackgroundChange={(v) => {
          void setRemoveBackgroundEnabled(v);
        }}
        onConfirm={() => {
          void confirmPrepare();
        }}
        onCancel={() => reset(false)}
      />

      {isReady && (
        <>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => reset(false)}
              disabled={
                state.isExporting ||
                state.isExportingSvg ||
                state.isPreparingQuote
              }
            >
              Välj ny bild
            </Button>
          </div>

          <ImagePreview
            src={processedUrl}
            alt="Förhandsvisning av lasergravyr"
            isProcessing={state.isProcessing}
            footer={
              <ThresholdSlider
                variant="glass"
                value={state.threshold}
                onChange={setThreshold}
                disabled={busy || state.skipDither}
              />
            }
          />

          <div className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-5">
            <SettingsModeToggle
              value={state.settingsMode}
              onChange={(settingsMode) => {
                setState((s) => ({ ...s, settingsMode }));
              }}
              disabled={busy}
            />

            {state.prepareNote && (
              <p className="text-xs text-muted-foreground" role="status">
                {state.prepareNote}
              </p>
            )}

            <SizeMmControl
              value={state.widthMm}
              onChange={setWidthMm}
              disabled={busy}
            />

            {isSimple ? (
              <StylePicker
                activeStyleId={state.activeStyleId}
                onSelect={(style) => {
                  void applyStyle(style);
                }}
                disabled={busy}
              />
            ) : (
              <div className="space-y-4">
                <NormalizeLevelsToggle
                  checked={state.normalizeLevelsEnabled}
                  onCheckedChange={setNormalizeLevelsEnabled}
                  disabled={busy || state.skipDither}
                />

                <DitherSelector
                  value={state.algorithm}
                  onChange={setAlgorithm}
                  disabled={busy || state.skipDither}
                  label="Teknisk algoritm"
                />

                <ToneControls
                  contrast={state.contrast}
                  gamma={state.gamma}
                  onContrastChange={setContrast}
                  onGammaChange={setGamma}
                  disabled={busy || state.skipDither}
                />

                {state.algorithm === "halftone" && (
                  <HalftoneDensitySlider
                    value={state.halftoneCellScale}
                    onChange={setHalftoneCellScale}
                    disabled={busy || state.skipDither}
                  />
                )}

                {state.algorithm === "randomThreshold" && (
                  <GrainSlider
                    value={state.noiseAmplitude}
                    onChange={setNoiseAmplitude}
                    disabled={busy || state.skipDither}
                  />
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <ExportButton
                onClick={handleExport}
                disabled={exportDisabled}
                isExporting={state.isExporting}
              />
              <ExportSvgButton
                onClick={handleExportSvg}
                disabled={exportDisabled}
                isExporting={state.isExportingSvg}
              />
              <QuoteButton
                onClick={() => {
                  void handleQuote();
                }}
                disabled={exportDisabled}
                isPreparing={state.isPreparingQuote}
              />
            </div>

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
            onClick={() => reset(false)}
          >
            Välj ny bild
          </Button>
        </div>
      )}
    </div>
  );
}
