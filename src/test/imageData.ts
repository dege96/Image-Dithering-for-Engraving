/** Minimal ImageData för Node-tester (utan canvas). */
export function createImageData(
  width: number,
  height: number,
  fill?: (x: number, y: number, idx: number) => [number, number, number, number],
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b, a] = fill?.(x, y, i) ?? [128, 128, 128, 255];
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return { width, height, data, colorSpace: "srgb" } as ImageData;
}
