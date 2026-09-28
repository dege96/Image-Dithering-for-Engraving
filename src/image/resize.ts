/**
 * Skalar ner till maxSize×maxSize utan att skalas upp.
 * Transparenta pixlar behålls.
 */
export function resizeImageData(
  imageData: ImageData,
  maxSize: number,
): ImageData {
  const { width, height } = imageData;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  if (scale >= 1) {
    return imageData;
  }

  const newWidth = Math.max(1, Math.round(width * scale));
  const newHeight = Math.max(1, Math.round(height * scale));

  // OffscreenCanvas fungerar i både main thread och worker
  const srcCanvas = new OffscreenCanvas(width, height);
  const srcCtx = srcCanvas.getContext("2d");
  if (!srcCtx) {
    throw new Error("PROCESS_FAIL");
  }
  srcCtx.putImageData(imageData, 0, 0);

  const dstCanvas = new OffscreenCanvas(newWidth, newHeight);
  const dstCtx = dstCanvas.getContext("2d");
  if (!dstCtx) {
    throw new Error("PROCESS_FAIL");
  }
  dstCtx.imageSmoothingEnabled = true;
  dstCtx.imageSmoothingQuality = "high";
  dstCtx.drawImage(srcCanvas, 0, 0, newWidth, newHeight);
  return dstCtx.getImageData(0, 0, newWidth, newHeight);
}
