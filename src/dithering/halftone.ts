/**
 * Cirkulär halftone: cellbaserade prickar vars radie styrs av luminans.
 * Cellstorlek skalas med bildens längsta sida så preview och export
 * får liknande pricktäthet (mål ~150 celler över längsta sidan).
 * `cellScale` (default 1): lägre = finare, högre = grövre.
 */

function cellSizeForImage(
  width: number,
  height: number,
  cellScale = 1,
): number {
  const longest = Math.max(width, height);
  const base = Math.max(4, Math.round(longest / 150));
  return Math.max(2, Math.round(base * cellScale));
}

export function halftoneDither(
  imageData: ImageData,
  threshold: number,
  cellScale = 1,
): ImageData {
  const { width, height, data } = imageData;
  const cell = cellSizeForImage(width, height, cellScale);
  const out = new ImageData(width, height);
  out.data.fill(255);
  for (let i = 3; i < out.data.length; i += 4) {
    out.data[i] = 255;
  }

  const maxR = (cell / 2) * Math.SQRT2;
  const thresholdScale = 0.5 + threshold / 100;

  for (let cy = 0; cy < height; cy += cell) {
    for (let cx = 0; cx < width; cx += cell) {
      let sum = 0;
      let count = 0;
      let opaque = 0;

      const endY = Math.min(cy + cell, height);
      const endX = Math.min(cx + cell, width);

      for (let y = cy; y < endY; y++) {
        for (let x = cx; x < endX; x++) {
          const i = (y * width + x) * 4;
          if (data[i + 3] === 0) continue;
          opaque++;
          sum += data[i]!;
          count++;
        }
      }

      if (opaque === 0) {
        for (let y = cy; y < endY; y++) {
          for (let x = cx; x < endX; x++) {
            const i = (y * width + x) * 4;
            out.data[i] = 255;
            out.data[i + 1] = 255;
            out.data[i + 2] = 255;
            out.data[i + 3] = 0;
          }
        }
        continue;
      }

      const avg = count > 0 ? sum / count : 255;
      const darkness = 1 - avg / 255;
      const radius = darkness * maxR * thresholdScale;

      const centerX = cx + cell / 2;
      const centerY = cy + cell / 2;

      for (let y = cy; y < endY; y++) {
        for (let x = cx; x < endX; x++) {
          const i = (y * width + x) * 4;
          if (data[i + 3] === 0) {
            out.data[i] = 255;
            out.data[i + 1] = 255;
            out.data[i + 2] = 255;
            out.data[i + 3] = 0;
            continue;
          }
          const dx = x + 0.5 - centerX;
          const dy = y + 0.5 - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const v = dist <= radius ? 0 : 255;
          out.data[i] = v;
          out.data[i + 1] = v;
          out.data[i + 2] = v;
          out.data[i + 3] = 255;
        }
      }
    }
  }

  return out;
}
