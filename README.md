# Gravyr-preview

Mobilanpassad webbapp för lasergravyr-förhandsvisning. Kunden laddar upp ett foto, väljer en enkel gravyrstil och skickar bilden för offert. Avancerade algoritmer, bakgrundsborttagning och PNG/SVG-export finns under **Avancerade inställningar**.

All bildbehandling körs lokalt i webbläsaren. Pixlar lämnar inte enheten (utom när kunden själv mejlar den nedladdade filen).

## Kom igång

```bash
npm install
npm run dev
```

Öppna [http://127.0.0.1:43127](http://127.0.0.1:43127).

```bash
npm run build
npm run start
npm test
```

## Miljövariabler

Skapa `.env.local`:

```bash
# Offertknappens mål (default: /offert)
NEXT_PUBLIC_QUOTE_URL=/offert

# Mottagare för mailto-formuläret på /offert
NEXT_PUBLIC_QUOTE_EMAIL=din@epost.se
```

## Flöde

1. Ladda upp JPG/PNG/WebP (max 25 MB)
2. Välj gravyrstil: **Klassisk**, **Abstrakt**, **Grynig** eller **Halftone**
3. Tryck **Skicka för gravyr** — PNG laddas ner och offertsidan öppnas
4. Fyll i formuläret och bifoga PNG:en i mejlet
5. Under **Avancerade inställningar**: ta bort bakgrund, teknisk algoritm, tröskel, ladda ner PNG/SVG

### Teknik

- Preview: Rec.709-grayscale + auto-levels + dither via Web Worker (max 1200 px)
- Export: samma pipeline i full upplösning via worker
- SVG: svarta run-length-`<rect>`, storlek i **mm** (default 254 DPI), ingen vit bakgrund
- Metadata i PNG tEXt / SVG-kommentar

## Manuell bildkontroll

Se [docs/IMAGE_TEST_CHECKLIST.md](docs/IMAGE_TEST_CHECKLIST.md).

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

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Web Worker för `processImage`
- Vitest för enhetstester
- Utbytbart `removeBackground`-interface (`@imgly/background-removal`)
