"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type RemoveBackgroundToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function RemoveBackgroundToggle({
  checked,
  onCheckedChange,
  disabled,
  className,
}: RemoveBackgroundToggleProps) {
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
        aria-label="Ta bort bakgrund"
      />
      <span>Ta bort bakgrund</span>
    </label>
  );
}
