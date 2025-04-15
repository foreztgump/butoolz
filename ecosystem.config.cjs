// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'next-app',
      script: 'server.js',
      env: {
        NODE_ENV: 'production'
      },
      exec_mode: 'cluster',
      instances: 'max',
    },
    {
      name: 'scheduler',
      script: 'scripts/scheduler.mjs',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
    },
  ],
}; 