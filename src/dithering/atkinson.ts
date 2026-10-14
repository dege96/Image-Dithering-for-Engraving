import { errorDiffusionDither, type KernelTap } from "@/dithering/errorDiffusion";

/**
 * Atkinson dithering.
 * Matris (÷8):
 *     X  1  1
 *  1  1  1
 *     1
 */
const KERNEL: readonly KernelTap[] = [
  [1, 0, 1],
  [2, 0, 1],
  [-1, 1, 1],
  [0, 1, 1],
  [1, 1, 1],
  [0, 2, 1],
];

export function atkinsonDither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  return errorDiffusionDither(imageData, threshold, KERNEL, 8);
}
