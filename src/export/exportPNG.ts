import { APP_VERSION, type DitherAlgorithm } from "@/presets/default";
import { processImage } from "@/image/processImage";

export type ExportMetadata = {
  algorithm: DitherAlgorithm;
  threshold: number;
  version: string;
};

export function buildExportFilename(
  algorithm: DitherAlgorithm,
  threshold: number,
): string {
  return `gravyr-${algorithm}-threshold-${threshold}.png`;
}

async function encodePngWithMetadata(
  imageData: ImageData,
  metadata: ExportMetadata,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("PROCESS_FAIL");
  ctx.putImageData(imageData, 0, 0);

  const baseBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("PROCESS_FAIL"));
      else resolve(blob);
    }, "image/png");
  });

  try {
    const extract = (await import("png-chunks-extract")).default;
    const encode = (await import("png-chunks-encode")).default;
    const text = (await import("png-chunk-text")).default;

    const buffer = new Uint8Array(await baseBlob.arrayBuffer());
    const chunks = extract(buffer);
    const metaJson = JSON.stringify({
      algorithm: metadata.algorithm,
      threshold: metadata.threshold,
      version: metadata.version,
    });
    chunks.splice(-1, 0, text.encode("gravyr", metaJson));
    const encoded = encode(chunks);
    const copy = Uint8Array.from(encoded);
    return new Blob([copy], { type: "image/png" });
  } catch {
    // Fallback: metadata finns i filnamnet
    return baseBlob;
  }
}

/**
 * Exporterar gravyr-PNG i full beskuren upplösning (ingen uppskalning).
 */
export async function exportPNG(
  foregroundImage: ImageData,
  algorithm: DitherAlgorithm,
  threshold: number,
): Promise<{ blob: Blob; filename: string; metadata: ExportMetadata }> {
  const processed = processImage(foregroundImage, {
    algorithm,
    threshold,
    // ingen maxSize → ingen nedskalning, ingen uppskalning
  });

  const metadata: ExportMetadata = {
    algorithm,
    threshold,
    version: APP_VERSION,
  };

  const blob = await encodePngWithMetadata(processed, metadata);
  return {
    blob,
    filename: buildExportFilename(algorithm, threshold),
    metadata,
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
