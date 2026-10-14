"use client";

import { Slider } from "@/components/ui/slider";
import {
  MAX_CONTRAST,
  MAX_GAMMA,
  MIN_CONTRAST,
  MIN_GAMMA,
  clampContrast,
  clampGamma,
} from "@/presets/default";

type ToneControlsProps = {
  contrast: number;
  gamma: number;
  onContrastChange: (value: number) => void;
  onGammaChange: (value: number) => void;
  disabled?: boolean;
};

function formatTone(value: number): string {
  return value.toFixed(2);
}

export function ToneControls({
  contrast,
  gamma,
  onContrastChange,
  onGammaChange,
  disabled,
}: ToneControlsProps) {
  const c = clampContrast(contrast);
  const g = clampGamma(gamma);

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="contrast" className="text-sm font-medium">
            Kontrast
          </label>
          <span className="tabular-nums text-sm text-muted-foreground">
            {formatTone(c)}
          </span>
        </div>
        <Slider
          id="contrast"
          min={MIN_CONTRAST}
          max={MAX_CONTRAST}
          step={0.05}
          value={[c]}
          disabled={disabled}
          onValueChange={(vals) => {
            const next = Array.isArray(vals) ? vals[0] : vals;
            if (typeof next === "number") onContrastChange(clampContrast(next));
          }}
          aria-label={`Kontrast, ${MIN_CONTRAST}–${MAX_CONTRAST}`}
        />
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="gamma" className="text-sm font-medium">
            Gamma
          </label>
          <span className="tabular-nums text-sm text-muted-foreground">
            {formatTone(g)}
          </span>
        </div>
        <Slider
          id="gamma"
          min={MIN_GAMMA}
          max={MAX_GAMMA}
          step={0.05}
          value={[g]}
          disabled={disabled}
          onValueChange={(vals) => {
            const next = Array.isArray(vals) ? vals[0] : vals;
            if (typeof next === "number") onGammaChange(clampGamma(next));
          }}
          aria-label={`Gamma, ${MIN_GAMMA}–${MAX_GAMMA}`}
        />
      </div>
    </div>
  );
}
