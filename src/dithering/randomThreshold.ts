/**
 * Random threshold — deterministiskt brus per pixel (ingen seed-UI).
 * Tröskeln styr mittpunkten; `noiseAmplitude` styr brusstyrka (±, default 32).
 */

function hashNoise(x: number, y: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n = n ^ (n >>> 16);
  return (n >>> 0) / 4294967296; // 0..1
}

export function randomThresholdDither(
  imageData: ImageData,
  threshold: number,
  noiseAmplitude = 32,
): ImageData {
  const { width, height, data } = imageData;
  const out = new ImageData(width, height);
  const t = (threshold / 100) * 255;
  const amplitude = Math.max(0, noiseAmplitude);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha === 0) {
        out.data[i] = 255;
        out.data[i + 1] = 255;
        out.data[i + 2] = 255;
        out.data[i + 3] = 0;
        continue;
      }
      const noise = (hashNoise(x, y) - 0.5) * 2 * amplitude;
      const v = data[i] + noise < t ? 0 : 255;
      out.data[i] = v;
      out.data[i + 1] = v;
      out.data[i + 2] = v;
      out.data[i + 3] = 255;
    }
  }

  return out;
}
