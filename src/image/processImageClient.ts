"use client";

import {
  processImage,
  type ProcessImageOptions,
} from "@/image/processImage";
import type {
  ProcessWorkerRequest,
  ProcessWorkerResponse,
} from "@/workers/processImage.worker";

type Pending = {
  resolve: (data: ImageData) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();
let workerFailed = false;

function getWorker(): Worker | null {
  if (workerFailed || typeof window === "undefined") return null;
  if (worker) return worker;

  try {
    worker = new Worker(
      new URL("../workers/processImage.worker.ts", import.meta.url),
    );
    worker.onmessage = (event: MessageEvent<ProcessWorkerResponse>) => {
      const msg = event.data;
      const entry = pending.get(msg.id);
      if (!entry) return;
      pending.delete(msg.id);
      if (msg.ok) {
        entry.resolve(msg.imageData);
      } else {
        entry.reject(new Error(msg.error || "PROCESS_FAIL"));
      }
    };
    worker.onerror = () => {
      workerFailed = true;
      for (const [, entry] of pending) {
        entry.reject(new Error("PROCESS_FAIL"));
      }
      pending.clear();
      worker?.terminate();
      worker = null;
    };
    return worker;
  } catch {
    workerFailed = true;
    return null;
  }
}

/**
 * Kör processImage i Web Worker när möjligt, annars på main thread.
 */
export function processImageAsync(
  imageData: ImageData,
  options: ProcessImageOptions,
): Promise<ImageData> {
  const w = getWorker();
  if (!w) {
    return Promise.resolve().then(() => processImage(imageData, options));
  }

  const id = nextId++;
  return new Promise<ImageData>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    // Klona ImageData så källbufferten inte transfereras bort från main
    const copy = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height,
    );
    const request: ProcessWorkerRequest = {
      id,
      imageData: copy,
      options,
    };
    w.postMessage(request, [copy.data.buffer]);
  });
}
