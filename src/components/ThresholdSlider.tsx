"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  MAX_THRESHOLD,
  MIN_THRESHOLD,
  clampThreshold,
} from "@/presets/default";

type ThresholdSliderProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  /** Frosted glass look for overlay on preview */
  variant?: "default" | "glass";
};

export function ThresholdSlider({
  value,
  onChange,
  disabled,
  className,
  variant = "default",
}: ThresholdSliderProps) {
  const clamped = clampThreshold(value);
  const isGlass = variant === "glass";

  return (
    <div
      className={cn(
        "space-y-2.5",
        isGlass &&
          "rounded-xl border border-white/30 bg-white/15 px-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-lg supports-[backdrop-filter]:bg-white/10 dark:border-white/10 dark:bg-black/20 dark:supports-[backdrop-filter]:bg-black/15",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="threshold"
          className={cn(
            "text-sm font-medium",
            isGlass && "text-neutral-900 dark:text-white",
          )}
        >
          Ljusare / Mörkare
        </label>
        <span
          className={cn(
            "tabular-nums text-sm",
            isGlass
              ? "text-neutral-800 dark:text-white/80"
              : "text-muted-foreground",
          )}
        >
          {clamped}
        </span>
      </div>
      <Slider
        id="threshold"
        min={MIN_THRESHOLD}
        max={MAX_THRESHOLD}
        step={1}
        value={[clamped]}
        disabled={disabled}
        onValueChange={(vals) => {
          const next = Array.isArray(vals) ? vals[0] : vals;
          if (typeof next === "number") onChange(clampThreshold(next));
        }}
        aria-label={`Ljusare eller mörkare motiv, ${MIN_THRESHOLD}–${MAX_THRESHOLD}`}
      />
    </div>
  );
}
