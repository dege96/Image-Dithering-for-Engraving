"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ImagePreviewProps = {
  src: string | null;
  alt: string;
  isProcessing?: boolean;
  className?: string;
  /** Overlay i botten, lagerad ovanpå bilden */
  footer?: ReactNode;
};

export function ImagePreview({
  src,
  alt,
  isProcessing = false,
  className,
  footer,
}: ImagePreviewProps) {
  return (
    <div
      aria-busy={isProcessing}
      className={cn(
        "relative flex min-h-[240px] w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-100 sm:min-h-[320px]",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="max-h-[70vh] max-w-full object-contain"
        />
      ) : (
        <p className="text-sm text-muted-foreground">Ingen förhandsvisning ännu</p>
      )}
      {isProcessing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
          <div
            className="flex flex-col items-center gap-2 px-4 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
            <p className="text-sm font-medium text-foreground">Bearbetar…</p>
          </div>
        </div>
      )}
      {footer && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4">
          <div className="pointer-events-auto">{footer}</div>
        </div>
      )}
    </div>
  );
}
