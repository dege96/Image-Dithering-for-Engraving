"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALGORITHM_LABELS,
  DITHER_ALGORITHMS,
  type DitherAlgorithm,
} from "@/presets/default";

type DitherSelectorProps = {
  value: DitherAlgorithm;
  onChange: (value: DitherAlgorithm) => void;
  disabled?: boolean;
  label?: string;
};

export function DitherSelector({
  value,
  onChange,
  disabled,
  label = "Algoritm",
}: DitherSelectorProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="dither-algorithm" className="text-sm font-medium">
        {label}
      </label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as DitherAlgorithm)}
        disabled={disabled}
      >
        <SelectTrigger id="dither-algorithm" className="w-full">
          <SelectValue placeholder="Välj algoritm" />
        </SelectTrigger>
        <SelectContent>
          {DITHER_ALGORITHMS.map((algo) => (
            <SelectItem key={algo} value={algo}>
              {ALGORITHM_LABELS[algo]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
