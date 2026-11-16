"use client";

import { useEffect, useId, useRef } from "react";
import { RemoveBackgroundToggle } from "@/components/RemoveBackgroundToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PrepareImageDialogProps = {
  open: boolean;
  imageSrc: string | null;
  removeBackgroundEnabled: boolean;
  isBusy?: boolean;
  statusLabel?: string | null;
  onRemoveBackgroundChange: (enabled: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PrepareImageDialog({
  open,
  imageSrc,
  removeBackgroundEnabled,
  isBusy = false,
  statusLabel = null,
  onRemoveBackgroundChange,
  onConfirm,
  onCancel,
}: PrepareImageDialogProps) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isBusy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Stäng"
        className="absolute inset-0 bg-black/50"
        disabled={isBusy}
        onClick={() => {
          if (!isBusy) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-lg sm:p-5"
      >
        <div className="space-y-1">
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            Förbered bild
          </h2>
          <p className="text-sm text-muted-foreground">
            Välj om bakgrunden ska tas bort innan gravyrförhandsvisningen.
          </p>
        </div>

        <div
          className={cn(
            "relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-lg sm:min-h-[280px]",
            removeBackgroundEnabled
              ? "bg-[image:repeating-conic-gradient(#e5e5e5_0%_25%,#fafafa_0%_50%)] bg-[size:16px_16px]"
              : "bg-neutral-100",
          )}
        >
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={
                removeBackgroundEnabled
                  ? "Bild med borttagen bakgrund"
                  : "Uppladdad bild"
              }
              className="max-h-[55vh] max-w-full object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Laddar bild…</p>
          )}
          {isBusy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
              <div
                className="flex flex-col items-center gap-2 px-4 text-center"
                role="status"
                aria-live="polite"
              >
                <div className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {statusLabel ?? "Bearbetar…"}
                </p>
              </div>
            </div>
          )}
        </div>

        <RemoveBackgroundToggle
          checked={removeBackgroundEnabled}
          onCheckedChange={onRemoveBackgroundChange}
          disabled={isBusy}
        />

        {statusLabel && !isBusy && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {statusLabel}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isBusy}
          >
            Avbryt
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            size="lg"
            onClick={onConfirm}
            disabled={isBusy || !imageSrc}
          >
            Klar
          </Button>
        </div>
      </div>
    </div>
  );
}
