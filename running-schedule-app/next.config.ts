import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.74",
    "running.fhettinga.nl",
  ],
};

export default nextConfig;
