import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip TS check during build — CI handles type validation via tsc --noEmit.
  // Production builds may OOM during the Next.js TS checker (needs 2.5GB+).
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
