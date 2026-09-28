/**
 * Jarvis–Judice–Ninke error diffusion dithering.
 * Matris (÷48):
 *         X  7  5
 *     3  5  7  5  3
 *     1  3  5  3  1
 */
export function jarvisDither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  const { width, height } = imageData;
  const out = new ImageData(width, height);
  const buffer = new Float32Array(width * height);
  const alpha = new Uint8ClampedArray(width * height);

  for (let i = 0, p = 0; i < imageData.data.length; i += 4, p++) {
    buffer[p] = imageData.data[i];
    alpha[p] = imageData.data[i + 3];
  }

  const t = (threshold / 100) * 255;
  const diffuse = (x: number, y: number, err: number, factor: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (alpha[idx] === 0) return;
    buffer[idx] += (err * factor) / 48;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const a = alpha[idx];
      const outIdx = idx * 4;

      if (a === 0) {
        out.data[outIdx] = 255;
        out.data[outIdx + 1] = 255;
        out.data[outIdx + 2] = 255;
        out.data[outIdx + 3] = 0;
        continue;
      }

      const old = buffer[idx];
      const neu = old < t ? 0 : 255;
      const err = old - neu;
      out.data[outIdx] = neu;
      out.data[outIdx + 1] = neu;
      out.data[outIdx + 2] = neu;
      out.data[outIdx + 3] = 255;

      diffuse(x + 1, y, err, 7);
      diffuse(x + 2, y, err, 5);
      diffuse(x - 2, y + 1, err, 3);
      diffuse(x - 1, y + 1, err, 5);
      diffuse(x, y + 1, err, 7);
      diffuse(x + 1, y + 1, err, 5);
      diffuse(x + 2, y + 1, err, 3);
      diffuse(x - 2, y + 2, err, 1);
      diffuse(x - 1, y + 2, err, 3);
      diffuse(x, y + 2, err, 5);
      diffuse(x + 1, y + 2, err, 3);
      diffuse(x + 2, y + 2, err, 1);
    }
  }

  return out;
}
