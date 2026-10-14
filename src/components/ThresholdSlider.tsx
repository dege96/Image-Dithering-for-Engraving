"use client";

import { Slider } from "@/components/ui/slider";
import {
  MAX_THRESHOLD,
  MIN_THRESHOLD,
  clampThreshold,
} from "@/presets/default";

type ThresholdSliderProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function ThresholdSlider({
  value,
  onChange,
  disabled,
}: ThresholdSliderProps) {
  const clamped = clampThreshold(value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="threshold" className="text-sm font-medium">
          Tröskel
        </label>
        <span className="tabular-nums text-sm text-muted-foreground">
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
        aria-label={`Tröskelvärde ${MIN_THRESHOLD}–${MAX_THRESHOLD}`}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Ljusare motiv ({MIN_THRESHOLD})</span>
        <span>Mörkare motiv ({MAX_THRESHOLD})</span>
      </div>
    </div>
  );
}
