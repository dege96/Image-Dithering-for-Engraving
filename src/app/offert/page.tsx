import type { Metadata } from "next";
import { OffertForm } from "@/app/offert/OffertForm";

export const metadata: Metadata = {
  title: "Offert | Gravyr-preview",
  description: "Skicka din gravyrbild för offert.",
};

export default function OffertPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Offert
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Skicka din gravyr
        </h1>
        <p className="text-muted-foreground">
          Vi har förberett din bild. Fyll i dina uppgifter så öppnas ett mejl
          där du bifogar den nedladdade PNG-filen.
        </p>
      </div>
      <OffertForm />
    </main>
  );
}
