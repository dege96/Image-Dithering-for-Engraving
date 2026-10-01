"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CompareToggle } from "@/components/CompareToggle";
import { DitherSelector } from "@/components/DitherSelector";
import { ExportButton } from "@/components/ExportButton";
import { ImagePreview } from "@/components/ImagePreview";
import { ImageUploader } from "@/components/ImageUploader";
import { QuoteButton } from "@/components/QuoteButton";
import { RemoveBackgroundToggle } from "@/components/RemoveBackgroundToggle";
import { ThresholdSlider } from "@/components/ThresholdSlider";
import { Button } from "@/components/ui/button";
import { downloadBlob, exportPNG } from "@/export/exportPNG";
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
  DEFAULT_ALGORITHM,
  DEFAULT_THRESHOLD,
  PREVIEW_MAX_SIZE,
  SLIDER_DEBOUNCE_MS,
  type DitherAlgorithm,
  type ViewMode,
} from "@/presets/default";

type AppState = {
  originalImage: ImageData | null;
  /** Cachead BG-removal (beskuren). null tills modellen körts en gång för aktuell bild. */
  bgRemovedImage: ImageData | null;
  /** Källa till dither/export — original eller bgRemoved beroende på toggle. */
  foregroundImage: ImageData | null;
  processedImage: ImageData | null;
  algorithm: DitherAlgorithm;
  threshold: number;
  removeBackgroundEnabled: boolean;
  isPreparing: boolean;
  isProcessing: boolean;
  isExporting: boolean;
  viewMode: ViewMode;
  error: string | null;
};

const initialState: AppState = {
  originalImage: null,
  bgRemovedImage: null,
  foregroundImage: null,
  processedImage: null,
  algorithm: DEFAULT_ALGORITHM,
  threshold: DEFAULT_THRESHOLD,
  removeBackgroundEnabled: false,
  isPreparing: false,
  isProcessing: false,
  isExporting: false,
  viewMode: "gravyr",
  error: null,
};

function getQuoteUrl(): string {
  return process.env.NEXT_PUBLIC_QUOTE_URL || "/offert";
}

export function GravyrApp() {
  const [state, setState] = useState<AppState>(initialState);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [prepareLabel, setPrepareLabel] = useState("Förbereder din bild…");
  const requestId = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceFileRef = useRef<File | null>(null);
  const bgCacheRef = useRef<ImageData | null>(null);
  const removeBgEnabledRef = useRef(false);

  const revoke = (url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  };

  const reset = (keepToggle = true) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestId.current += 1;
    revoke(originalUrl);
    revoke(processedUrl);
    setOriginalUrl(null);
    setProcessedUrl(null);
    sourceFileRef.current = null;
    bgCacheRef.current = null;
    setState((s) => ({
      ...initialState,
      removeBackgroundEnabled: keepToggle
        ? s.removeBackgroundEnabled
        : false,
    }));
  };

  const runProcess = useCallback(
    async (
      foreground: ImageData,
      algorithm: DitherAlgorithm,
      threshold: number,
    ) => {
      const id = ++requestId.current;
      setState((s) => ({ ...s, isProcessing: true, error: null }));
      try {
        const result = await processImageAsync(foreground, {
          algorithm,
          threshold,
          maxSize: PREVIEW_MAX_SIZE,
        });
        if (id !== requestId.current) return;
        const url = await imageDataToObjectUrl(result);
        setProcessedUrl((prev) => {
          revoke(prev);
          return url;
        });
        setState((s) => ({
          ...s,
          processedImage: result,
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
    [],
  );

  const scheduleProcess = useCallback(
    (
      foreground: ImageData,
      algorithm: DitherAlgorithm,
      threshold: number,
      immediate = false,
    ) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (immediate) {
        void runProcess(foreground, algorithm, threshold);
        return;
      }
      debounceRef.current = setTimeout(() => {
        void runProcess(foreground, algorithm, threshold);
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
    }));
    setPrepareLabel("Förbereder din bild…");

    try {
      const img = await loadImage(file);
      const original = imageToImageData(img);
      const origUrl = await imageDataToObjectUrl(original);
      setOriginalUrl(origUrl);

      let foreground: ImageData = original;
      let bgRemoved: ImageData | null = null;

      if (enabled) {
        bgRemoved = await ensureBgRemoved(file);
        foreground = bgRemoved;
      }

      setState((s) => ({
        ...s,
        originalImage: original,
        bgRemovedImage: bgRemoved,
        foregroundImage: foreground,
        removeBackgroundEnabled: enabled,
        isPreparing: false,
      }));

      await runProcess(foreground, DEFAULT_ALGORITHM, DEFAULT_THRESHOLD);
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
      // Tillbaka till originalpipeline — ingen transparent mask
      setState((s) => ({
        ...s,
        foregroundImage: original,
        removeBackgroundEnabled: false,
      }));
      scheduleProcess(original, state.algorithm, state.threshold, true);
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

    // Använd cache om den finns, annars kör modellen en gång
    if (bgCacheRef.current || state.bgRemovedImage) {
      const cached = bgCacheRef.current ?? state.bgRemovedImage!;
      bgCacheRef.current = cached;
      setState((s) => ({
        ...s,
        bgRemovedImage: cached,
        foregroundImage: cached,
        removeBackgroundEnabled: true,
      }));
      scheduleProcess(cached, state.algorithm, state.threshold, true);
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
      await runProcess(bgRemoved, state.algorithm, state.threshold);
    } catch (err) {
      if (id !== requestId.current) return;
      // Misslyckad BG — återställ toggle och behåll originalpipeline
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

  const setAlgorithm = (algorithm: DitherAlgorithm) => {
    setState((s) => ({ ...s, algorithm }));
    if (state.foregroundImage) {
      scheduleProcess(state.foregroundImage, algorithm, state.threshold, true);
    }
  };

  const setThreshold = (threshold: number) => {
    setState((s) => ({ ...s, threshold }));
    if (state.foregroundImage) {
      scheduleProcess(state.foregroundImage, state.algorithm, threshold);
    }
  };

  const handleExport = async () => {
    if (!state.foregroundImage) return;
    setState((s) => ({ ...s, isExporting: true, error: null }));
    try {
      const { blob, filename } = await exportPNG(
        state.foregroundImage,
        state.algorithm,
        state.threshold,
      );
      downloadBlob(blob, filename);
      setState((s) => ({ ...s, isExporting: false }));
    } catch {
      setState((s) => ({
        ...s,
        isExporting: false,
        error: messageForError(new Error("EXPORT_FAIL")),
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      revoke(originalUrl);
      revoke(processedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasImage = Boolean(state.originalImage || state.foregroundImage);
  const previewSrc =
    state.viewMode === "original" ? originalUrl : processedUrl;
  const previewAlt =
    state.viewMode === "original"
      ? "Originalbild"
      : "Förhandsvisning av lasergravyr";
  const busy = state.isPreparing || state.isProcessing || state.isExporting;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="space-y-2 text-center sm:text-left">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Lasergravyr
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Gravyr-preview
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Ladda upp ett foto, se hur det blir som lasergravyr och ladda ner en
          PNG till din offert.
        </p>
      </header>

      {!hasImage && !state.isPreparing && (
        <div className="space-y-3">
          <ImageUploader disabled={busy} onFile={handleFile} />
          <RemoveBackgroundToggle
            checked={state.removeBackgroundEnabled}
            onCheckedChange={(v) => {
              removeBgEnabledRef.current = v;
              setState((s) => ({ ...s, removeBackgroundEnabled: v }));
            }}
            disabled={busy}
          />
        </div>
      )}

      {(hasImage || state.isPreparing) && (
        <>
          <ImagePreview
            src={state.isPreparing ? originalUrl : previewSrc}
            alt={state.isPreparing ? "Uppladdad bild" : previewAlt}
            isProcessing={state.isPreparing || state.isProcessing}
          />

          {state.isPreparing && (
            <p className="text-center text-sm text-muted-foreground">
              {prepareLabel}
            </p>
          )}

          {hasImage && (
            <div className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CompareToggle
                  value={state.viewMode}
                  onChange={(viewMode) =>
                    setState((s) => ({ ...s, viewMode }))
                  }
                  disabled={busy}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => reset(true)}
                  disabled={state.isExporting}
                >
                  Välj ny bild
                </Button>
              </div>

              <RemoveBackgroundToggle
                checked={state.removeBackgroundEnabled}
                onCheckedChange={(v) => {
                  void setRemoveBackgroundEnabled(v);
                }}
                disabled={busy}
              />

              <DitherSelector
                value={state.algorithm}
                onChange={setAlgorithm}
                disabled={busy}
              />

              <ThresholdSlider
                value={state.threshold}
                onChange={setThreshold}
                disabled={busy}
              />

              <div className="flex flex-col gap-2 sm:flex-row">
                <ExportButton
                  onClick={handleExport}
                  disabled={!state.foregroundImage || state.isPreparing}
                  isExporting={state.isExporting}
                />
                <QuoteButton
                  href={getQuoteUrl()}
                  disabled={!state.foregroundImage}
                />
              </div>
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
