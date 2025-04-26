/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Or your existing config
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Fix: Add modules that shouldn't be bundled on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, // Keep existing fallbacks
        child_process: false, // Prevent bundling 'child_process'
        worker_threads: false, // Prevent bundling 'worker_threads'
        fs: false, // Add 'fs' if other dependencies cause issues
        // Add other Node.js modules here if needed
      };
    }

    return config;
  },
};

module.exports = nextConfig; 