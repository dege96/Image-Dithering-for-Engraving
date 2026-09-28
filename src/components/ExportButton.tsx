"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  isExporting?: boolean;
};

export function ExportButton({
  onClick,
  disabled,
  isExporting,
}: ExportButtonProps) {
  return (
    <Button
      type="button"
      size="lg"
      className="w-full sm:w-auto"
      onClick={onClick}
      disabled={disabled || isExporting}
    >
      <Download data-icon="inline-start" />
      {isExporting ? "Exporterar…" : "Ladda ner PNG"}
    </Button>
  );
}
