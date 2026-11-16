# Bildfixture-checklista (manuell)

Kör igenom följande motivtyper efter ändringar i dithering, tonkontroll, porträttprepare eller export. Använd stilarna **Porträtt**, Klassisk, Abstrakt, Grynig och Halftone.

## Motiv

| # | Typ | Vad du tittar efter |
|---|-----|---------------------|
| 1 | Porträtt (ansikte framifrån) | Ögon, mun, näsa igenkännbara; inga stora svarta hål i skuggor; auto-prepare ger bra default |
| 2 | Djur (päls/fjäder) | Textur synlig utan att bli brusig fläck |
| 3 | Föremål (produktfoto) | Kanter skarpa, ytor jämna |
| 4 | Landskap | Himmel/mark åtskilda, subtila gradienter behåller form |
| 5 | Högkontrast (silhuett/logo) | Ren teckning; Threshold under Avancerat vid behov |
| 6 | Subtila detaljer (sömmar, textur) | Detaljer syns i Klassisk/Porträtt utan att drunkna |
| 7 | Redan ditherad PNG | Appen hoppar över ny dither och visar notis |

## Kontroller per motiv

1. Preview ser rimlig ut på mobil och desktop.
2. Justera Ljusare/Mörkare — resultatet ändras förutsägbart (utom vid skip-dither).
3. Exportera PNG och öppna i bildvisare — motivet matchar preview (samma maxSize via oak-profil).
4. Exportera SVG, importera i LightBurn — fysisk storlek i mm stämmer med angiven bredd (default 80 mm).
5. Skicka för gravyr — PNG laddas ner och offertformuläret öppnas.
6. Porträtt-stil: bakgrund tas bort automatiskt när analysen föreslår det.

## Anteckningar

- Preview, PNG och SVG delar `engravingProfile.raster.maxSize` (1000 px) för paritet.
- SVG-metadata anger **effektiv** DPI efter nedskalning, inte bara nominell 254.
- Laserhastighet/effekt/passes finns inte i profilen förrän gravyrtester på ek verifierats.
- Halftone under Avancerat: cellstorlek skalas med bildstorlek; jämför ändå preview vs export visuellt.
