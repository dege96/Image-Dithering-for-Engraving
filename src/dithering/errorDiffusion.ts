/**
 * Gemensam error-diffusion-kärna.
 * kernel: [dx, dy, weight] — weight summeras typiskt till divisor.
 */
export type KernelTap = readonly [dx: number, dy: number, weight: number];

export function errorDiffusionDither(
  imageData: ImageData,
  threshold: number,
  kernel: readonly KernelTap[],
  divisor: number,
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

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const outIdx = idx * 4;

      if (alpha[idx] === 0) {
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

      for (const [dx, dy, weight] of kernel) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (alpha[nIdx] === 0) continue;
        buffer[nIdx] += (err * weight) / divisor;
      }
    }
  }

  return out;
}
