import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
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

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`API listening on :${port}`))
