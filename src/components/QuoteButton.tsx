"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuoteButtonProps = {
  href: string;
  disabled?: boolean;
};

export function QuoteButton({ href, disabled }: QuoteButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full sm:w-auto"
      disabled={disabled}
      asChild={!disabled}
    >
      {disabled ? (
        <span>
          <ExternalLink data-icon="inline-start" />
          Be om offert
        </span>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer">
          <ExternalLink data-icon="inline-start" />
          Be om offert
        </a>
      )}
    </Button>
  );
}
