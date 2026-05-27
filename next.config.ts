import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/Crewly" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/Crewly/" : "",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
