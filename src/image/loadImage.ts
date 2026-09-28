export async function loadImage(file: File): Promise<HTMLImageElement> {
  if (!file.type.startsWith("image/")) {
    throw new Error("INVALID_IMAGE");
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("INVALID_IMAGE"));
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function imageToImageData(image: CanvasImageSource): ImageData {
  const width =
    "naturalWidth" in image
      ? (image.naturalWidth as number) || (image as HTMLImageElement).width
      : (image as ImageBitmap).width;
  const height =
    "naturalHeight" in image
      ? (image.naturalHeight as number) || (image as HTMLImageElement).height
      : (image as ImageBitmap).height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("PROCESS_FAIL");
  }
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, width, height);
}

export function imageDataToBlob(imageData: ImageData, type = "image/png"): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("PROCESS_FAIL"));
  }
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PROCESS_FAIL"));
        return;
      }
      resolve(blob);
    }, type);
  });
}

export function imageDataToObjectUrl(imageData: ImageData): Promise<string> {
  return imageDataToBlob(imageData).then((blob) => URL.createObjectURL(blob));
}
