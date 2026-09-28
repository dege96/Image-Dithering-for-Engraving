"use client";

import { Slider } from "@/components/ui/slider";

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
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="threshold" className="text-sm font-medium">
          Tröskel
        </label>
        <span className="tabular-nums text-sm text-muted-foreground">{value}</span>
      </div>
      <Slider
        id="threshold"
        min={0}
        max={100}
        step={1}
        value={[value]}
        disabled={disabled}
        onValueChange={(vals) => {
          const next = Array.isArray(vals) ? vals[0] : vals;
          if (typeof next === "number") onChange(next);
        }}
        aria-label="Tröskelvärde"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Ljusare motiv</span>
        <span>Mörkare motiv</span>
      </div>
    </div>
  );
}
