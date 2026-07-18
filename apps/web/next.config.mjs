import { resolve } from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the monorepo root so build traces ignore unrelated lockfiles elsewhere.
  outputFileTracingRoot: resolve(import.meta.dirname, "..", ".."),
  // The FoodMap packages ship TypeScript source via workspace `exports`.
  transpilePackages: [
    "@foodmap/domain",
    "@foodmap/config",
    "@foodmap/integrations",
    "@foodmap/test-fixtures",
    "@foodmap/api",
  ],
  webpack: (config) => {
    // Resolve ESM ".js" specifiers in TypeScript source to their ".ts"/".tsx"
    // files (our workspace packages import with explicit .js extensions).
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
