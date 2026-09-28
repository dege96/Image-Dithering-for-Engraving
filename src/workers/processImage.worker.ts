/// <reference lib="webworker" />

import { processImage, type ProcessImageOptions } from "@/image/processImage";

export type ProcessWorkerRequest = {
  id: number;
  imageData: ImageData;
  options: ProcessImageOptions;
};

export type ProcessWorkerResponse =
  | { id: number; ok: true; imageData: ImageData }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<ProcessWorkerRequest>) => {
  const { id, imageData, options } = event.data;
  try {
    const result = processImage(imageData, options);
    const response: ProcessWorkerResponse = { id, ok: true, imageData: result };
    // Transferera buffer för snabbare postMessage
    (self as DedicatedWorkerGlobalScope).postMessage(response, [
      result.data.buffer,
    ]);
  } catch (err) {
    const response: ProcessWorkerResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : "PROCESS_FAIL",
    };
    (self as DedicatedWorkerGlobalScope).postMessage(response);
  }
};
