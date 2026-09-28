# Gravyr-preview

Mobilanpassad webbapp för lasergravyr-förhandsvisning. Kunden laddar upp ett foto, bakgrunden tas bort i webbläsaren, och resultatet visas live med Jarvis-, Atkinson- eller Threshold-dithering. PNG exporteras till offert.

All bildbehandling körs lokalt i webbläsaren. Pixlar lämnar inte enheten.

## Kom igång

```bash
npm install
npm run dev
```

Öppna [http://127.0.0.1:43127](http://127.0.0.1:43127).

Bygg för produktion:

```bash
npm run build
npm run start
```

## Miljövariabler

Skapa `.env.local` vid behov:

```bash
# Länk för "Be om offert"-knappen (default: /offert)
NEXT_PUBLIC_QUOTE_URL=/offert
```

Sätt `NEXT_PUBLIC_QUOTE_URL` till din riktiga offert-/kontakt-URL. I v1 bifogar kunden den nedladdade PNG:en manuellt i formuläret.

## Flöde

1. Ladda upp JPG/PNG/WebP
2. Bakgrund tas bort en gång (`@imgly/background-removal`) och cacheas
3. Bilden beskärs till motivet + padding
4. Live preview: Rec.709-grayscale + vald algoritm (max 1200×1200)
5. Exportera PNG i full beskuren upplösning (ingen uppskalning)
6. Filnamn: `gravyr-{algorithm}-threshold-{n}.png`
7. Metadata `{ algorithm, threshold, version: "1.0" }` bäddas in som PNG tEXt när det går

## Iframe

Sidan är en enkel yta som kan bäddas in:

```html
<iframe
  src="https://din-domän.se/"
  title="Gravyr-preview"
  style="width:100%;min-height:720px;border:0;"
  allow="clipboard-write"
></iframe>
```

## Bakgrundsmodell

Första gången en bild förbereds hämtas AI-modellen för bakgrundsborttagning från CDN (`@imgly/background-removal`). Det kan ta några sekunder. Därefter återanvänds den i sessionen. Parametrar (algoritm/tröskel) kör om endast dithering — inte modellen.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Web Worker för `processImage`
- Utbytbart `removeBackground`-interface (imgly-adapter i v1)

## Projektstruktur

```
src/
  components/   UI (uploader, preview, tabs, slider, export, offert)
  image/        load, crop, grayscale, resize, processImage, BG-adapter
  dithering/    jarvis, atkinson, threshold
  export/       PNG + metadata
  workers/      processImage.worker.ts
  presets/      defaults
```
