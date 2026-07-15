// PM2 process definition for the VPS. Two processes: Express API + Next.js.
// Usage: pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: 'akganesh-api',
      cwd: './apps/api',
      script: 'src/index.js', // ESM; loads its own .env via dotenv, auto-migrates + seeds
      env: { NODE_ENV: 'production', PORT: 4000 },
      max_memory_restart: '400M',
    },
    {
      name: 'akganesh-web',
      cwd: './apps/web',
      script: 'npm', // works with npm workspaces (next is hoisted to root node_modules)
      args: 'run start',
      env: { NODE_ENV: 'production', PORT: 3000 },
      max_memory_restart: '600M',
    },
  ],
}
