"use client";

import { Slider } from "@/components/ui/slider";
import {
  DEFAULT_NOISE_AMPLITUDE,
  MAX_NOISE_AMPLITUDE,
  MIN_NOISE_AMPLITUDE,
  clampNoiseAmplitude,
} from "@/presets/default";

type GrainSliderProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function GrainSlider({ value, onChange, disabled }: GrainSliderProps) {
  const clamped = clampNoiseAmplitude(value ?? DEFAULT_NOISE_AMPLITUDE);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="grain" className="text-sm font-medium">
          Grynighet
        </label>
        <span className="tabular-nums text-sm text-muted-foreground">
          {clamped}
        </span>
      </div>
      <Slider
        id="grain"
        min={MIN_NOISE_AMPLITUDE}
        max={MAX_NOISE_AMPLITUDE}
        step={1}
        value={[clamped]}
        disabled={disabled}
        onValueChange={(vals) => {
          const next = Array.isArray(vals) ? vals[0] : vals;
          if (typeof next === "number") onChange(clampNoiseAmplitude(next));
        }}
        aria-label={`Grynighet, ${MIN_NOISE_AMPLITUDE}–${MAX_NOISE_AMPLITUDE}`}
      />
    </div>
  );
}
