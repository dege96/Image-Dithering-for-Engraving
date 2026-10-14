import { BLUE_NOISE_64 } from "@/dithering/blueNoiseMatrix";

const SIZE = 64;
const MAX = SIZE * SIZE;

/**
 * Blue-noise ordered dither med förberäknad 64×64-rankmatris.
 * Tröskeln förskjuter jämförelsen som i Bayer.
 */
export function blueNoiseDither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  const { width, height, data } = imageData;
  const out = new ImageData(width, height);
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
      const rank = BLUE_NOISE_64[(y % SIZE) * SIZE + (x % SIZE)];
      const level = ((rank + 0.5) / MAX) * 255 + bias;
      const v = data[i] < level ? 0 : 255;
      out.data[i] = v;
      out.data[i + 1] = v;
      out.data[i + 2] = v;
      out.data[i + 3] = 255;
    }
  }

  return out;
}
