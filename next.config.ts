import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep Node.js-only packages out of the webpack bundle
  serverExternalPackages: ["@anthropic-ai/sdk", "bcryptjs"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client bundle: alias the SDK to a lightweight stub so the dynamic
      // import in RemoteAIProvider fails gracefully and falls back to MockAIProvider
      config.resolve.alias = {
        ...config.resolve.alias,
        "@anthropic-ai/sdk": require("path").resolve(
          __dirname,
          "src/lib/ai/anthropic-browser-stub.ts",
        ),
      };
    }
    return config;
  },
};

export default nextConfig;
