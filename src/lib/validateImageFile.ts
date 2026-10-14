import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/presets/default";

const ALLOWED = new Set<string>(ALLOWED_IMAGE_TYPES);

export function validateImageFile(file: File): void {
  if (!ALLOWED.has(file.type)) {
    throw new Error("INVALID_IMAGE");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }
}
