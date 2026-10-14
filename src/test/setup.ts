/** Polyfill ImageData for Node/Vitest. */
class ImageDataPolyfill {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace;

  constructor(
    dataOrWidth: Uint8ClampedArray | number,
    widthOrHeight?: number,
    height?: number,
  ) {
    if (typeof dataOrWidth === "number") {
      this.width = dataOrWidth;
      this.height = widthOrHeight ?? 0;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = dataOrWidth;
      this.width = widthOrHeight ?? 0;
      this.height = height ?? 0;
    }
    this.colorSpace = "srgb";
  }
}

if (typeof globalThis.ImageData === "undefined") {
  // @ts-expect-error test polyfill
  globalThis.ImageData = ImageDataPolyfill;
}
