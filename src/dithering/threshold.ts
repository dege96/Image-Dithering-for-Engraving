/**
 * Enkel tröskel: pixlar under threshold → svart, annars vit.
 * threshold anges 0–100 (UI clamp 20–55) och mappas till 0–255.
 */
export function thresholdDither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  const { width, height, data } = imageData;
  const out = new ImageData(width, height);
  const t = (threshold / 100) * 255;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) {
      out.data[i] = 255;
      out.data[i + 1] = 255;
      out.data[i + 2] = 255;
      out.data[i + 3] = 0;
      continue;
    }
    const v = data[i] < t ? 0 : 255;
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = 255;
  }

  return out;
}
