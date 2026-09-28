"use client";

import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/presets/default";

type CompareToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  disabled?: boolean;
};

export function CompareToggle({
  value,
  onChange,
  disabled,
}: CompareToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
      <Button
        type="button"
        size="sm"
        variant={value === "gravyr" ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => onChange("gravyr")}
        className="rounded-md"
      >
        Gravyr
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "original" ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => onChange("original")}
        className="rounded-md"
      >
        Visa original
      </Button>
    </div>
  );
}
