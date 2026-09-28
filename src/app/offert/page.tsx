import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offert | Gravyr-preview",
  description: "Skicka din exporterade gravyr-PNG för offert.",
};

export default function OffertPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Offert
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Skicka din gravyr för offert
        </h1>
        <p className="text-muted-foreground">
          Ladda ner PNG:en från Gravyr-preview och bifoga den i ditt
          offertformulär. Sätt{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            NEXT_PUBLIC_QUOTE_URL
          </code>{" "}
          till din riktiga offertsida när den finns.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Tillbaka till preview</Link>
      </Button>
    </main>
  );
}
