import { errorDiffusionDither, type KernelTap } from "@/dithering/errorDiffusion";

/**
 * Jarvis–Judice–Ninke error diffusion dithering.
 * Matris (÷48):
 *         X  7  5
 *     3  5  7  5  3
 *     1  3  5  3  1
 */
const KERNEL: readonly KernelTap[] = [
  [1, 0, 7],
  [2, 0, 5],
  [-2, 1, 3],
  [-1, 1, 5],
  [0, 1, 7],
  [1, 1, 5],
  [2, 1, 3],
  [-2, 2, 1],
  [-1, 2, 3],
  [0, 2, 5],
  [1, 2, 3],
  [2, 2, 1],
];

export function jarvisDither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  return errorDiffusionDither(imageData, threshold, KERNEL, 48);
}
