/**
 * Utbytbart interface för bakgrundsborttagning.
 * Adapter: @bg0/browser (BiRefNet-lite, WebGPU/WASM).
 */
export type RemoveBackgroundInput =
  | File
  | Blob
  | ImageData
  | HTMLImageElement
  | ImageBitmap;

export interface RemoveBackground {
  (input: RemoveBackgroundInput): Promise<ImageData>;
}

function blobToImageData(blob: Blob): Promise<ImageData> {
  return createImageBitmap(blob).then((bitmap) => {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      bitmap.close();
      throw new Error("BG_FAIL");
    }
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close();
    return data;
  });
}

async function toBlob(input: RemoveBackgroundInput): Promise<Blob> {
  if (input instanceof Blob) {
    return input;
  }
  if (typeof ImageData !== "undefined" && input instanceof ImageData) {
    const canvas = document.createElement("canvas");
    canvas.width = input.width;
    canvas.height = input.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("BG_FAIL");
    ctx.putImageData(input, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("BG_FAIL");
    return blob;
  }
  if (input instanceof HTMLImageElement || input instanceof ImageBitmap) {
    const width =
      input instanceof HTMLImageElement
        ? input.naturalWidth || input.width
        : input.width;
    const height =
      input instanceof HTMLImageElement
        ? input.naturalHeight || input.height
        : input.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("BG_FAIL");
    ctx.drawImage(input, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("BG_FAIL");
    return blob;
  }
  throw new Error("BG_FAIL");
}

export const removeBackground: RemoveBackground = async (input) => {
  try {
    const { removeBackground: bg0Remove } = await import("@bg0/browser");
    const blob = await toBlob(input);
    // quality=quality: lätt mask-refinement, hårdare kanter (bättre för gravyr/dither)
    const result = await bg0Remove(blob, { quality: "quality" });
    return blobToImageData(result.blob);
  } catch {
    throw new Error("BG_FAIL");
  }
};
