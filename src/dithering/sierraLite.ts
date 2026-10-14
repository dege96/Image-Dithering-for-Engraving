import { errorDiffusionDither, type KernelTap } from "@/dithering/errorDiffusion";

/**
 * Sierra Lite error diffusion.
 * Matris (÷4):
 *     X  2
 *  1  1
 */
const KERNEL: readonly KernelTap[] = [
  [1, 0, 2],
  [-1, 1, 1],
  [0, 1, 1],
];

export function sierraLiteDither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  return errorDiffusionDither(imageData, threshold, KERNEL, 4);
}
