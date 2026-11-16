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
2. Standardstil **Porträtt** analyserar bilden och förbereder den för ek + 5 W diodlaser
3. Justera **Bredd (mm)** vid behov (default 80 mm)
4. Eller välj **Klassisk**, **Abstrakt**, **Grynig** eller **Halftone**
5. Tryck **Skicka för gravyr** — PNG laddas ner och offertsidan öppnas
6. Fyll i formuläret och bifoga PNG:en i mejlet
7. Under **Avancerade inställningar**: ta bort bakgrund, teknisk algoritm, tröskel, ladda ner PNG/SVG

### Teknik

- Profil: `oak-5w-diode` v1 (`src/presets/engravingProfile.ts`) — versionshanterade mm/DPI/raster/dither-defaults
- Porträtt: `analyzePortrait` → `preparePortrait` (villkorad ton/brus/BG) → en dither-pass
- Preview / PNG / SVG: samma `processImage`-pipeline och samma `raster.maxSize` (1000 px) för paritet
- SVG: svarta 2D-packade `<rect>`, storlek i **mm**, metadata med **effektiv** DPI
- Metadata i PNG tEXt / SVG-kommentar
- Laserhastighet/effekt är medvetet utelämnade tills fysiska tester på ek
- Backup om pixel-dither inte räcker: [docs/BACKUP_PRICKVEKTOR.md](docs/BACKUP_PRICKVEKTOR.md)

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
- Utbytbart `removeBackground`-interface (`@bg0/browser`, BiRefNet-lite)
