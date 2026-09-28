import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tillåt Web Worker via new URL(..., import.meta.url)
  turbopack: {},
  // onnxruntime-web / imgly hämtar WASM och modeller i klienten
  serverExternalPackages: ["@imgly/background-removal", "onnxruntime-web"],
};

export default nextConfig;
