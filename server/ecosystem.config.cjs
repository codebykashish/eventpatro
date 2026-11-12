// PM2 Process Manager Configuration for Eventpatro Express Backend
module.exports = {
  apps: [
    {
      name: 'eventpatro-backend',
      script: './src/server.js',
      cwd: '/var/www/eventpatro/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
}
