# Backup: prickvektor (Shpigford)

Appen använder bara **pixel-dither** (PNG/SVG via `processImage`).

## När detta kan behövas

Om pixel-dither ger för grovt resultat på ek/diodlaser — t.ex. för mjuka porträtttoningar eller när lasern beter sig bättre med **riktiga prickar i mm** (cirklar/rektanglar) istället för packed rects — överväg en prickvektor-pipeline.

## Referens

- Inspiration: [Shpigford/dither](https://github.com/Shpigford/dither) (MIT)
- Tidigare lokal port fanns i `src/dotGrid/` (borttagen): skalade prickar eller dither + fasta prickar, SVG med geometri i mm

## Enkel återinföring

1. Porterar igen från Shpigford eller den tidigare `Image-Dithering-Shpigford`-porten
2. Håll det som valfri pipeline under Avancerat — enkelvyn ska fortsätta köra pixel-dither
3. Offert/PNG till kund bör helst fortfarande vara pixel-PNG för stabilitet

Håll standardvägen enkel tills fysiska tester visar att pixel-dither inte räcker.
