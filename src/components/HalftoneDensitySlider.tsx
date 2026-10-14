"use client";

import { Slider } from "@/components/ui/slider";
import {
  DEFAULT_HALFTONE_CELL_SCALE,
  MAX_HALFTONE_CELL_SCALE,
  MIN_HALFTONE_CELL_SCALE,
  clampHalftoneCellScale,
} from "@/presets/default";

type HalftoneDensitySliderProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function HalftoneDensitySlider({
  value,
  onChange,
  disabled,
}: HalftoneDensitySliderProps) {
  const clamped = clampHalftoneCellScale(value ?? DEFAULT_HALFTONE_CELL_SCALE);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="halftone-density" className="text-sm font-medium">
          Finare / Grövre
        </label>
        <span className="tabular-nums text-sm text-muted-foreground">
          {clamped.toFixed(2)}
        </span>
      </div>
      <Slider
        id="halftone-density"
        min={MIN_HALFTONE_CELL_SCALE}
        max={MAX_HALFTONE_CELL_SCALE}
        step={0.05}
        value={[clamped]}
        disabled={disabled}
        onValueChange={(vals) => {
          const next = Array.isArray(vals) ? vals[0] : vals;
          if (typeof next === "number") {
            onChange(clampHalftoneCellScale(next));
          }
        }}
        aria-label={`Halftone prickstorlek, ${MIN_HALFTONE_CELL_SCALE} finare till ${MAX_HALFTONE_CELL_SCALE} grövre`}
      />
    </div>
  );
}
