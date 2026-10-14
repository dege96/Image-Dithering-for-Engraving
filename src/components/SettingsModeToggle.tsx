"use client";

import { Button } from "@/components/ui/button";
import type { SettingsMode } from "@/presets/default";

type SettingsModeToggleProps = {
  value: SettingsMode;
  onChange: (value: SettingsMode) => void;
  disabled?: boolean;
};

export function SettingsModeToggle({
  value,
  onChange,
  disabled,
}: SettingsModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Inställningsläge"
      className="flex w-full rounded-lg border border-border bg-muted/40 p-1"
    >
      <Button
        type="button"
        size="sm"
        role="radio"
        aria-checked={value === "simple"}
        variant={value === "simple" ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => onChange("simple")}
        className="flex-1 justify-center rounded-md text-center"
      >
        Enkla inställningar
      </Button>
      <Button
        type="button"
        size="sm"
        role="radio"
        aria-checked={value === "advanced"}
        variant={value === "advanced" ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => onChange("advanced")}
        className="flex-1 justify-center rounded-md text-center"
      >
        Avancerade inställningar
      </Button>
    </div>
  );
}
