import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tillåt Web Worker via new URL(..., import.meta.url)
  turbopack: {},
  // bg0 / transformers hämtar WASM och modeller i klienten
  serverExternalPackages: ["@bg0/browser", "@huggingface/transformers"],
};

export default nextConfig;
