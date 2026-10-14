"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuoteButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  isPreparing?: boolean;
};

export function QuoteButton({
  onClick,
  disabled,
  isPreparing,
}: QuoteButtonProps) {
  return (
    <Button
      type="button"
      size="lg"
      className="w-full sm:w-auto"
      disabled={disabled || isPreparing}
      onClick={onClick}
    >
      <Send data-icon="inline-start" />
      {isPreparing ? "Förbereder…" : "Skicka för gravyr"}
    </Button>
  );
}
