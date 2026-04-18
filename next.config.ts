import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // THE FIX: This explicitly tells Next.js to leave the PDF library alone
  // and safely run it on the Node.js server without breaking its functions.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
