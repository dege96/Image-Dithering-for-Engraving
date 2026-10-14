/**
 * Ordered dithering med Bayer-matriser (4×4 och 8×8).
 * Tröskeln (0–100) förskjuter jämförelsen runt mittläget.
 */

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

const BAYER_8: readonly (readonly number[])[] = (() => {
  const m: number[][] = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const bx = x % 4;
      const by = y % 4;
      const quad = (y < 4 ? 0 : 2) + (x < 4 ? 0 : 1);
      const offsets = [0, 2, 3, 1];
      m[y][x] = 4 * BAYER_4[by][bx] + offsets[quad];
    }
  }
  return m;
})();

function orderedBayerDither(
  imageData: ImageData,
  threshold: number,
  matrix: readonly (readonly number[])[],
): ImageData {
  const { width, height, data } = imageData;
  const out = new ImageData(width, height);
  const n = matrix.length;
  const max = n * n;
  const bias = ((threshold / 100) - 0.5) * 255;

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
      const level = ((matrix[y % n][x % n] + 0.5) / max) * 255 + bias;
      const v = data[i] < level ? 0 : 255;
      out.data[i] = v;
      out.data[i + 1] = v;
      out.data[i + 2] = v;
      out.data[i + 3] = 255;
    }
  }

  return out;
}

export function bayer4Dither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  return orderedBayerDither(imageData, threshold, BAYER_4);
}

export function bayer8Dither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  return orderedBayerDither(imageData, threshold, BAYER_8);
}
