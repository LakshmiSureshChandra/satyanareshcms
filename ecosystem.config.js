// PM2 process definition for the Hostinger VPS.
// Usage: pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: 'akganesh-api',
      cwd: './apps/api',
      script: 'src/index.js',
      node_args: '--env-file=.env',
      env: { NODE_ENV: 'production', PORT: 4000 },
      max_memory_restart: '300M',
    },
    {
      name: 'akganesh-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '500M',
    },
  ],
}
