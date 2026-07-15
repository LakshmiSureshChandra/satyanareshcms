import 'dotenv/config' // load .env when started as plain `node src/index.js` (Hostinger)
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { db } from './lib/db.js'
import { seedDatabase } from './lib/seed.js'
import authRoutes from './routes/auth.js'
import publicRoutes from './routes/public.js'
import adminRoutes from './routes/admin.js'

const app = express()
app.set('trust proxy', 1) // behind Caddy in production

app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true }))
app.use(express.json({ limit: '5mb' }))
app.use(cookieParser())

app.use('/uploads', express.static(process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'), {
  maxAge: '30d', immutable: true,
}))

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', publicRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
})

import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

// Migrations known to have been applied by the pre-tracker deploy. Used to
// baseline an existing database the first time the tracker runs.
const BASELINE_MIGRATIONS = ['20260711131901_init', '20260711164707_contact_submissions']

// Apply pending migrations by running their SQL directly through the existing DB
// connection — NO child process (shared hosting caps process spawns -> EAGAIN).
// Tracks applied migrations in `_migrations` so new ones apply on existing DBs too.
async function runMigrations() {
  if (process.env.SKIP_MIGRATE === 'true') return
  try {
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS `_migrations` (`name` VARCHAR(191) NOT NULL, `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`name`))'
    )
    const rows = await db.$queryRawUnsafe('SELECT name FROM `_migrations`')
    const applied = new Set(rows.map((r) => r.name))

    // Existing DB from before the tracker: mark the original migrations as applied
    // so we don't try to re-create tables that already exist.
    if (applied.size === 0) {
      const u = await db.$queryRawUnsafe(
        "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'"
      )
      if (Number(u[0].c) > 0) {
        for (const name of BASELINE_MIGRATIONS) {
          await db.$executeRawUnsafe('INSERT IGNORE INTO `_migrations` (name) VALUES (?)', name)
          applied.add(name)
        }
        console.log('Baselined existing database.')
      }
    }

    const here = path.dirname(fileURLToPath(import.meta.url))
    const migDir = path.resolve(here, '../prisma/migrations')
    const dirs = fs
      .readdirSync(migDir)
      .filter((d) => fs.existsSync(path.join(migDir, d, 'migration.sql')))
      .sort()

    for (const d of dirs) {
      if (applied.has(d)) continue
      const sql = fs.readFileSync(path.join(migDir, d, 'migration.sql'), 'utf8')
      const statements = sql
        .split(';')
        .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
        .filter(Boolean)
      for (const stmt of statements) await db.$executeRawUnsafe(stmt)
      await db.$executeRawUnsafe('INSERT INTO `_migrations` (name) VALUES (?)', d)
      console.log('Applied migration', d)
    }
    console.log('Migrations up to date.')
  } catch (e) {
    console.error('Migration step:', e.message)
  }
}

// First-boot seed: if the DB has no users yet, add sample content. Idempotent.
async function ensureSeeded() {
  if (process.env.AUTO_SEED === 'false') return
  try {
    if ((await db.user.count()) === 0) {
      console.log('Empty database — seeding initial content…')
      await seedDatabase(db)
      console.log('Seed complete. Admin: admin@akganesh.com / Admin@123')
    }
  } catch (e) {
    console.error('Auto-seed skipped:', e.message)
  }
}

const port = process.env.PORT || 4000

// migrate + seed BEFORE serving, so the first request never hits missing tables
runMigrations()
  .then(ensureSeeded)
  .finally(() => app.listen(port, () => console.log(`API listening on :${port}`)))
