import type { NextConfig } from "next";
import type { Header } from "next/dist/lib/load-custom-routes";
import type { Configuration as WebpackConfiguration } from 'webpack';

const nextConfig: NextConfig = {
  output: "standalone",
  async headers(): Promise<Header[]> {
    return [
      {
        // Apply these headers to all routes in your application.
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
  /* config options here */
  webpack: (config: WebpackConfiguration, { isServer }: { isServer: boolean }): WebpackConfiguration => {
    // Fixes npm packages that depend on Node.js modules when bundling for the browser
    if (!isServer) {
      if (!config.resolve) {
        config.resolve = {};
      }
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        // Provide fallbacks for Node.js built-ins potentially used by dependencies
        child_process: false,
        worker_threads: false,
        async_hooks: false,    // From previous Turbopack error
        cluster: false,        // From previous Turbopack error
        crypto: false,         // Common Node.js module, add if needed later
        fs: false,             // Common Node.js module, add if needed later
        os: false,             // Common Node.js module, add if needed later
        perf_hooks: false,     // From previous Turbopack error
        process: false,        // Common Node.js module, add if needed later
        // Add any other Node.js modules that cause errors here
      };
    }

    // Return the modified config
    return config;
  },
};

export default nextConfig;
