"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ALGORITHM_LABELS,
  type DitherAlgorithm,
} from "@/presets/default";

type DitherSelectorProps = {
  value: DitherAlgorithm;
  onChange: (value: DitherAlgorithm) => void;
  disabled?: boolean;
};

const ALGORITHMS: DitherAlgorithm[] = ["jarvis", "atkinson", "threshold"];

export function DitherSelector({
  value,
  onChange,
  disabled,
}: DitherSelectorProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as DitherAlgorithm)}
      className="w-full"
    >
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
        {ALGORITHMS.map((algo) => (
          <TabsTrigger
            key={algo}
            value={algo}
            disabled={disabled}
            className="px-2 py-2 text-xs sm:text-sm"
          >
            {ALGORITHM_LABELS[algo]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
