"use client";

import { Upload } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type ImageUploaderProps = {
  disabled?: boolean;
  onFile: (file: File) => void;
  compact?: boolean;
};

export function ImageUploader({
  disabled,
  onFile,
  compact = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border bg-muted/40 text-center transition-colors",
        "hover:border-foreground/30 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "pointer-events-none opacity-60",
        compact ? "rounded-lg px-4 py-6" : "min-h-[220px] rounded-xl px-6 py-12 sm:min-h-[280px]",
      )}
    >
      <Upload className={cn("mb-3 text-muted-foreground", compact ? "size-6" : "size-8")} />
      <p className={cn("font-medium text-foreground", compact ? "text-sm" : "text-base sm:text-lg")}>
        Ladda upp bild
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        JPG, PNG eller WebP — dra och släpp eller tryck här
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
