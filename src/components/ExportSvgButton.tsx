"use client";

import { FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportSvgButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  isExporting?: boolean;
};

export function ExportSvgButton({
  onClick,
  disabled,
  isExporting,
}: ExportSvgButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full sm:w-auto"
      onClick={onClick}
      disabled={disabled || isExporting}
    >
      <FileCode2 data-icon="inline-start" />
      {isExporting ? "Exporterar SVG…" : "Ladda ner SVG"}
    </Button>
  );
}
