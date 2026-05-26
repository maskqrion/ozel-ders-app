import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export",  <-- Bu satırı tamamen sil veya başına // koy
  images: {
    loader: "custom",
    loaderFile: "./lib/utils/imageLoader.ts",
  },
};

export default nextConfig;