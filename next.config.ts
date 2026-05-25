import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    loader: "custom",
    loaderFile: "./lib/utils/imageLoader.ts",
  },
};

export default nextConfig;
