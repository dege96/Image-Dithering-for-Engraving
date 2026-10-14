/**
 * Mild histogram-stretch (auto-levels) för bättre tonfördelning före dither.
 * Stretchar opaka pixlar mellan ca 2:a–98:e percentilen till 0–255.
 */

function percentile(sorted: Uint8Array, p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((p / 100) * (sorted.length - 1))),
  );
  return sorted[idx]!;
}

export function normalizeLevels(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const values: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    values.push(data[i]!);
  }

  if (values.length < 16) {
    return imageData;
  }

  const sorted = Uint8Array.from(values.sort((a, b) => a - b));
  const low = percentile(sorted, 2);
  const high = percentile(sorted, 98);

  if (high <= low) {
    return imageData;
  }

  const range = high - low;
  const out = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]!;
    if (alpha === 0) {
      out.data[i] = 255;
      out.data[i + 1] = 255;
      out.data[i + 2] = 255;
      out.data[i + 3] = 0;
      continue;
    }
    const stretched = ((data[i]! - low) / range) * 255;
    const v = Math.max(0, Math.min(255, Math.round(stretched)));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = alpha;
  }

  return out;
}
