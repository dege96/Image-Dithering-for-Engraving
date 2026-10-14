/** Rec.709 luma: Y = 0.2126 R + 0.7152 G + 0.0722 B */
export function toGrayscale(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
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
    const y = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
    // Baka opacity mot vitt så suddiga/fadeade kanter blir mjuka toner
    // (dither sätter annars alpha=255 för allt > 0 → hårda kanter).
    const a = alpha / 255;
    const v = Math.round(y * a + 255 * (1 - a));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = 255;
  }

  return out;
}
