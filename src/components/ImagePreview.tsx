"use client";

import { cn } from "@/lib/utils";

type ImagePreviewProps = {
  src: string | null;
  alt: string;
  isProcessing?: boolean;
  className?: string;
};

export function ImagePreview({
  src,
  alt,
  isProcessing = false,
  className,
}: ImagePreviewProps) {
  return (
    <div
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
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
            <p className="text-sm font-medium text-foreground">
              Bearbetar…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
