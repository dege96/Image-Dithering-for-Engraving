"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type SizeMmControlProps = {
  value: number;
  onChange: (widthMm: number) => void;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
};

function clampSizeMm(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function SizeMmControl({
  value,
  onChange,
  disabled,
  className,
  min = 20,
  max = 300,
}: SizeMmControlProps) {
  const clamped = clampSizeMm(value, min, max);

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="size-mm" className="text-sm font-medium">
          Storlek
        </label>
        <span className="tabular-nums text-sm text-muted-foreground">
          {clamped} mm
        </span>
      </div>
      <Slider
        id="size-mm"
        min={min}
        max={max}
        step={1}
        value={[clamped]}
        disabled={disabled}
        onValueChange={(vals) => {
          const next = Array.isArray(vals) ? vals[0] : vals;
          if (typeof next === "number") onChange(clampSizeMm(next, min, max));
        }}
        aria-label={`Storlek i millimeter, ${min}–${max}`}
      />
    </div>
  );
}
