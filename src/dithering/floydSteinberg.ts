import { errorDiffusionDither, type KernelTap } from "@/dithering/errorDiffusion";

/**
 * Floyd–Steinberg error diffusion.
 * Matris (÷16):
 *     X  7
 *  3  5  1
 */
const KERNEL: readonly KernelTap[] = [
  [1, 0, 7],
  [-1, 1, 3],
  [0, 1, 5],
  [1, 1, 1],
];

export function floydSteinbergDither(
  imageData: ImageData,
  threshold: number,
): ImageData {
  return errorDiffusionDither(imageData, threshold, KERNEL, 16);
}
