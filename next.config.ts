import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      if (!config.resolve) {
        config.resolve = {};
      }
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        child_process: false,
        worker_threads: false,
        async_hooks: false,
        cluster: false,
        crypto: false,
        fs: false,
        os: false,
        perf_hooks: false,
        process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
