import { errorDiffusionDither, type KernelTap } from "@/dithering/errorDiffusion";

/**
 * Stucki error diffusion.
 * Matris (÷42):
 *         X  8  4
 *   2  4  8  4  2
 *   1  2  4  2  1
 */
const KERNEL: readonly KernelTap[] = [
  [1, 0, 8],
  [2, 0, 4],
  [-2, 1, 2],
  [-1, 1, 4],
  [0, 1, 8],
  [1, 1, 4],
  [2, 1, 2],
  [-2, 2, 1],
  [-1, 2, 2],
  [0, 2, 4],
  [1, 2, 2],
  [2, 2, 1],
];

export function stuckiDither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  return errorDiffusionDither(imageData, threshold, KERNEL, 42);
}
