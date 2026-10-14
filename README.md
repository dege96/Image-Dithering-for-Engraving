# Gravyr-preview

Mobilanpassad webbapp för lasergravyr-förhandsvisning. Kunden laddar upp ett foto, kan valfritt ta bort bakgrund, och ser resultatet live med valbar dither-algoritm (Jarvis, Atkinson, Floyd–Steinberg, Stucki, Sierra Lite, Bayer, Blue Noise, Halftone m.fl.). PNG och SVG exporteras till offert.

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
2. Valfritt: kryssa i **Ta bort bakgrund** (av som default). Då körs `@imgly/background-removal` en gång per bild och resultatet cacheas; av = originalbilden används utan modell
3. Vid BG-removal beskärs motivet + padding; utan BG körs grayscale/dither på hela originalet
4. Live preview: Rec.709-grayscale + vald algoritm via dropdown (max 1200×1200); tröskel **20–55** (default 50)
5. Exportera PNG eller SVG i full pipeline-upplösning (ingen preview-cap, ingen size-kontroll / uppskalning)
6. Filnamn: `gravyr-{algorithm}-threshold-{n}.png` / `.svg`
7. Metadata `{ algorithm, threshold, version: "1.0" }` i PNG tEXt respektive SVG-kommentar/`data-*`
8. SVG: svarta dither-pixlar som run-length-`<rect>` (vektoriserad bitmap, alltid högsta upplösning)

## Byta offert-URL

- Lokalt: `.env.local` → `NEXT_PUBLIC_QUOTE_URL=https://…` och starta om dev-servern
- Vercel: sätt samma variabel under Project → Settings → Environment Variables (Preview + Production) och redeploy (`NEXT_PUBLIC_*` bakas in vid build)
- Default om variabeln saknas: `/offert`

## Iframe

```html
<iframe
  src="https://DIN-VERCEL-URL.vercel.app/"
  title="Gravyr-preview"
  style="width:100%;min-height:720px;border:0;"
  allow="clipboard-write"
  loading="lazy"
></iframe>
```

## Bakgrundsmodell

Modellen körs bara när **Ta bort bakgrund** är ikryssad. Första gången hämtas den från CDN (`@imgly/background-removal`) och resultatet cacheas per uppladdad bild. Avmarkera = tillbaka till originalpipeline utan transparent mask. Algoritm/tröskel kör om endast dithering.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Web Worker för `processImage`
- Utbytbart `removeBackground`-interface (imgly-adapter i v1)

## Projektstruktur

```
src/
  components/   UI (uploader, preview, tabs, slider, export, offert)
  image/        load, crop, grayscale, resize, processImage, BG-adapter
  dithering/    jarvis, atkinson, floydSteinberg, stucki, sierraLite, bayer, blueNoise, halftone, randomThreshold, threshold
  export/       PNG/SVG + metadata
  workers/      processImage.worker.ts
  presets/      defaults
```
