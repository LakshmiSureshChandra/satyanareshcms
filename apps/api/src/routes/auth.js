import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import rateLimit from 'express-rate-limit'
import { db, notTrashed } from '../lib/db.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import { sendMail } from '../lib/mailer.js'

const router = Router()
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 })

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 3600 * 1000,
  path: '/',
}

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {}
  const user = await db.user.findFirst({ where: { email, status: true, ...notTrashed } })
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(422).json({ error: 'Invalid email or password' })
  res.cookie('token', signToken(user), cookieOpts)
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' })
  res.json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => res.json(req.user))

router.post('/forgot', loginLimiter, async (req, res) => {
  const user = await db.user.findFirst({ where: { email: req.body?.email, ...notTrashed } })
  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    await db.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiresAt: new Date(Date.now() + 3600 * 1000) },
    })
    const url = `${process.env.WEB_URL || 'http://localhost:3000'}/admin/reset-password?token=${token}`
    await sendMail({
      to: user.email,
      subject: 'Reset your password',
      html: `<p>Click to reset your password (valid 1 hour):</p><p><a href="${url}">${url}</a></p>`,
    }).catch(() => {})
  }
  // same response either way — don't leak which emails exist
  res.json({ ok: true })
})

router.post('/reset', loginLimiter, async (req, res) => {
  const { token, password } = req.body || {}
  if (!token || !password || password.length < 8)
    return res.status(422).json({ error: 'Password must be at least 8 characters' })
  const user = await db.user.findFirst({
    where: { resetToken: token, resetTokenExpiresAt: { gte: new Date() }, ...notTrashed },
  })
  if (!user) return res.status(422).json({ error: 'Invalid or expired reset link' })
  await db.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, 10), resetToken: null, resetTokenExpiresAt: null },
  })
  res.json({ ok: true })
})

// own profile update (any logged-in staff)
router.put('/profile', requireAuth, async (req, res) => {
  const { name, email, mobile, password } = req.body || {}
  if (!name || !email) return res.status(422).json({ error: 'Name and email are required' })
  if (mobile && !/^\d{10}$/.test(mobile)) return res.status(422).json({ error: 'Mobile must be 10 digits' })
  const clash = await db.user.findFirst({ where: { email, id: { not: req.user.id } } })
  if (clash) return res.status(422).json({ error: 'Email already in use' })
  const data = { name, email, mobile: mobile || null }
  if (password) data.password = await bcrypt.hash(password, 10)
  const user = await db.user.update({ where: { id: req.user.id }, data })
  res.cookie('token', signToken(user), cookieOpts)
  res.json({ ok: true })
})

export default router
