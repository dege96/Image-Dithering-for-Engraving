"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  buildMailtoHref,
  getQuoteEmail,
  readQuoteSession,
} from "@/lib/quote";

function subscribeQuoteSession() {
  return () => {};
}

export function OffertForm() {
  const session = useSyncExternalStore(
    subscribeQuoteSession,
    readQuoteSession,
    () => null,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submittedHint, setSubmittedHint] = useState<string | null>(null);

  const quoteEmail = getQuoteEmail();

  const canSubmit = useMemo(() => {
    return name.trim().length > 1 && email.trim().includes("@") && Boolean(quoteEmail);
  }, [name, email, quoteEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteEmail) return;
    const href = buildMailtoHref({
      to: quoteEmail,
      name: name.trim(),
      email: email.trim(),
      message,
      filename: session?.filename,
      algorithm: session?.algorithm,
      threshold: session?.threshold,
    });
    window.location.href = href;
    setSubmittedHint(
      session?.filename
        ? `Öppnar din e-postapp. Bifoga filen “${session.filename}” innan du skickar.`
        : "Öppnar din e-postapp. Bifoga den nedladdade PNG-filen innan du skickar.",
    );
  };

  return (
    <div className="space-y-6">
      <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>
          {session?.filename ? (
            <>
              PNG-filen <strong className="text-foreground">{session.filename}</strong>{" "}
              ska redan vara nedladdad.
            </>
          ) : (
            <>
              Gå tillbaka till preview, tryck{" "}
              <strong className="text-foreground">Skicka för gravyr</strong> så
              laddas PNG:en ner automatiskt.
            </>
          )}
        </li>
        <li>Fyll i formuläret nedan.</li>
        <li>Öppna mejlet och bifoga PNG-filen innan du skickar.</li>
      </ol>

      {!quoteEmail && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Offert via e-post är inte tillgänglig just nu. Gå tillbaka till
          preview och ladda ner PNG under Avancerade inställningar, eller
          kontakta verkstaden direkt.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="quote-name" className="text-sm font-medium">
            Namn
          </label>
          <input
            id="quote-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="quote-email" className="text-sm font-medium">
            Din e-post
          </label>
          <input
            id="quote-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="quote-message" className="text-sm font-medium">
            Meddelande <span className="font-normal text-muted-foreground">(valfritt)</span>
          </label>
          <textarea
            id="quote-message"
            name="message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="T.ex. önskad storlek, material eller leveransdatum"
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
          Öppna e-post med offertförfrågan
        </Button>
      </form>

      {submittedHint && (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {submittedHint}
        </p>
      )}

      <Button asChild variant="ghost" className="w-full">
        <Link href="/">Tillbaka till preview</Link>
      </Button>
    </div>
  );
}
