/**
 * Cirkulär halftone: cellbaserade prickar vars radie styrs av luminans.
 * Tröskeln påverkar prickstorleken (högre → mer svart).
 */

const CELL = 8;

export function halftoneDither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  const { width, height, data } = imageData;
  const out = new ImageData(width, height);
  // Fyll vit / transparent bakgrund först
  out.data.fill(255);
  for (let i = 3; i < out.data.length; i += 4) {
    out.data[i] = 255;
  }

  const maxR = (CELL / 2) * Math.SQRT2;
  const thresholdScale = 0.5 + threshold / 100; // ~0.7–1.55 inom UI-spann

  for (let cy = 0; cy < height; cy += CELL) {
    for (let cx = 0; cx < width; cx += CELL) {
      let sum = 0;
      let count = 0;
      let opaque = 0;

      const endY = Math.min(cy + CELL, height);
      const endX = Math.min(cx + CELL, width);

      for (let y = cy; y < endY; y++) {
        for (let x = cx; x < endX; x++) {
          const i = (y * width + x) * 4;
          if (data[i + 3] === 0) continue;
          opaque++;
          sum += data[i];
          count++;
        }
      }

      // Helt transparent cell → behåll transparent
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
      // Mörkare luminans → större svart prick
      const darkness = 1 - avg / 255;
      const radius = darkness * maxR * thresholdScale;

      const centerX = cx + CELL / 2;
      const centerY = cy + CELL / 2;

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
