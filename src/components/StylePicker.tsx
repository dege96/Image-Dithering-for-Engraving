"use client";

import { cn } from "@/lib/utils";
import {
  CUSTOMER_STYLES,
  customerStyleForPreset,
  type CustomerStyle,
  type DitherAlgorithm,
} from "@/presets/default";

type StylePickerProps = {
  algorithm: DitherAlgorithm;
  threshold: number;
  onSelect: (style: CustomerStyle) => void;
  disabled?: boolean;
};

export function StylePicker({
  algorithm,
  threshold,
  onSelect,
  disabled,
}: StylePickerProps) {
  const activeStyle = customerStyleForPreset(algorithm, threshold);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" id="gravyr-stil-label">
        Gravyrstil
      </p>
      <div
        role="radiogroup"
        aria-labelledby="gravyr-stil-label"
        className="grid gap-2 sm:grid-cols-2"
      >
        {CUSTOMER_STYLES.map((style) => {
          const selected = activeStyle === style.id;
          return (
            <button
              key={style.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onSelect(style)}
              className={cn(
                "rounded-lg border px-3 py-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:border-foreground/40",
                disabled && "pointer-events-none opacity-60",
              )}
            >
              <span className="block text-sm font-medium">{style.label}</span>
              <span
                className={cn(
                  "mt-1 block text-xs leading-snug",
                  selected ? "text-background/80" : "text-muted-foreground",
                )}
              >
                {style.description}
              </span>
            </button>
          );
        })}
      </div>
      {activeStyle == null && (
        <p className="text-xs text-muted-foreground">
          Anpassad stil vald under avancerade inställningar.
        </p>
      )}
    </div>
  );
}
