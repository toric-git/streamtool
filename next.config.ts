import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Seed on room create reads these MP3s via fs; include them in serverless traces.
  outputFileTracingIncludes: {
    "/*": ["./lib/sounds/default-assets/**/*"],
  },
};

export default nextConfig;
