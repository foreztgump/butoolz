// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'next-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      // env_production: { // Optional: environment variables specific to production
      //   NODE_ENV: 'production'
      // },
      exec_mode: 'cluster', // Optional: run in cluster mode for better performance
      instances: 'max',     // Optional: use all available CPU cores
    },
    {
      name: 'scheduler',
      script: 'scripts/scheduler.mjs',
      watch: false, // Don't restart scheduler on file changes
      // env_production: {
      //   NODE_ENV: 'production'
      // },
    },
  ],
}; 