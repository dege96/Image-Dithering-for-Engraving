import type { DitherAlgorithm } from "@/presets/default";

export const QUOTE_SESSION_KEY = "gravyr-quote";

export type QuoteSessionPayload = {
  filename: string;
  algorithm: DitherAlgorithm;
  threshold: number;
  preparedAt: string;
};

export function getQuoteUrl(): string {
  return process.env.NEXT_PUBLIC_QUOTE_URL || "/offert";
}

export function getQuoteEmail(): string {
  return process.env.NEXT_PUBLIC_QUOTE_EMAIL || "";
}

export function isInternalQuoteUrl(url: string): boolean {
  try {
    if (url.startsWith("/")) return true;
    if (typeof window === "undefined") return false;
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function saveQuoteSession(payload: QuoteSessionPayload): void {
  try {
    sessionStorage.setItem(QUOTE_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage kan saknas / vara full — offertsidan fungerar ändå
  }
}

export function readQuoteSession(): QuoteSessionPayload | null {
  try {
    const raw = sessionStorage.getItem(QUOTE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuoteSessionPayload;
  } catch {
    return null;
  }
}

export function buildMailtoHref(options: {
  to: string;
  name: string;
  email: string;
  message: string;
  filename?: string;
  algorithm?: string;
  threshold?: number;
}): string {
  const subject = "Offertförfrågan – lasergravyr";
  const lines = [
    "Hej!",
    "",
    "Jag vill beställa lasergravyr utifrån bilden jag förhandsvisade.",
    "",
    `Namn: ${options.name}`,
    `E-post: ${options.email}`,
  ];
  if (options.filename) {
    lines.push(`Fil: ${options.filename} (bifoga denna PNG i mejlet)`);
  }
  if (options.algorithm != null) {
    lines.push(`Stil: ${options.algorithm}`);
  }
  if (options.threshold != null) {
    lines.push(`Ljusare/mörkare: ${options.threshold}`);
  }
  if (options.message.trim()) {
    lines.push("", "Meddelande:", options.message.trim());
  }
  lines.push("", "Vänliga hälsningar");

  const params = new URLSearchParams({
    subject,
    body: lines.join("\n"),
  });
  return `mailto:${options.to}?${params.toString()}`;
}
