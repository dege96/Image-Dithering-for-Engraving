"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type NormalizeLevelsToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function NormalizeLevelsToggle({
  checked,
  onCheckedChange,
  disabled,
  className,
}: NormalizeLevelsToggleProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 text-sm font-medium",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        aria-label="Auto-nivåer"
      />
      <span>Auto-nivåer</span>
    </label>
  );
}
