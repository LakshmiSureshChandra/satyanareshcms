import { Router } from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { db, notTrashed } from '../lib/db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { uniqueSlug } from '../lib/slug.js'
import { revalidate } from '../lib/revalidate.js'

const router = Router()
router.use(requireAuth) // everything below needs a logged-in staff user
const adminOnly = requireRole('admin')

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, /^image\/(jpeg|png|webp|gif|x-icon|vnd\.microsoft\.icon)$/.test(file.mimetype)),
})

async function saveImage(file, { maxWidth = 1600 } = {}) {
  const id = crypto.randomBytes(8).toString('hex')
  const isIcon = /icon/.test(file.mimetype)
  const ext = isIcon ? path.extname(file.originalname) || '.ico' : '.webp'
  const name = `${Date.now()}-${id}${ext}`
  const dest = path.join(UPLOAD_DIR, name)
  if (isIcon) {
    fs.writeFileSync(dest, file.buffer)
  } else {
    await sharp(file.buffer).rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 82 }).toFile(dest)
  }
  return `/uploads/${name}`
}

function removeFile(url) {
  if (!url?.startsWith('/uploads/')) return
  fs.unlink(path.join(UPLOAD_DIR, path.basename(url)), () => {})
}

// ---- upload endpoint (used by TipTap image insert) ----
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(422).json({ error: 'No image uploaded' })
  res.json({ url: await saveImage(req.file) })
})

// ---- dashboard ----
router.get('/dashboard-stats', async (req, res) => {
  const [posts, pages, categories, users, viewsAgg, recent] = await Promise.all([
    db.post.count({ where: { type: 'post', ...notTrashed } }),
    db.post.count({ where: { type: 'page', ...notTrashed } }),
    db.category.count(),
    db.user.count({ where: notTrashed }),
    db.post.aggregate({ _sum: { views: true }, where: { type: 'post', ...notTrashed } }),
    db.post.findMany({
      where: { type: 'post', ...notTrashed },
      orderBy: { createdAt: 'desc' }, take: 8,
      select: { id: true, title: true, status: true, views: true, publishedAt: true, createdAt: true },
    }),
  ])
  res.json({ posts, pages, categories, users, totalViews: viewsAgg._sum.views || 0, recent })
})

// ---- posts & pages (shared handlers, type discriminator) ----
function postListHandler(type) {
  return async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = 20
    const where = { type, ...notTrashed }
    if (req.query.s) where.title = { contains: String(req.query.s) }
    if (req.query.status === 'published') where.status = true
    if (req.query.status === 'draft') where.status = false
    if (req.query.category) where.categories = { some: { categoryId: Number(req.query.category) } }
    const [total, items] = await Promise.all([
      db.post.count({ where }),
      db.post.findMany({
        where,
        orderBy: { [req.query.sort === 'title' ? 'title' : 'createdAt']: req.query.dir === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit, take: limit,
        select: {
          id: true, title: true, slug: true, status: true, publishedAt: true, views: true, createdAt: true,
          author: { select: { name: true } },
          categories: { select: { category: { select: { name: true } } } },
        },
      }),
    ])
    res.json({
      items: items.map((p) => ({ ...p, categories: p.categories.map((c) => c.category.name) })),
      total, page, pages: Math.ceil(total / limit),
    })
  }
}

function validatePost(body, type) {
  if (!body.title?.trim()) return 'Title is required'
  if (!body.content?.trim()) return 'Content is required'
  if (type === 'post') {
    if (!body.publishedAt) return 'Publish date is required'
    if (!Array.isArray(body.categoryIds) || !body.categoryIds.length) return 'Select at least one category'
  }
  return null
}

function postPaths(post) {
  const paths = ['/', post.type === 'page' ? `/page/${post.slug}` : `/${post.slug}`]
  return paths
}

function postSaveHandler(type, isUpdate) {
  return async (req, res) => {
    const err = validatePost(req.body, type)
    if (err) return res.status(422).json({ error: err })
    const b = req.body
    const existing = isUpdate ? await db.post.findFirst({ where: { id: Number(req.params.id), type } }) : null
    if (isUpdate && !existing) return res.status(404).json({ error: 'Not found' })

    let validCatIds = []
    if (type === 'post') {
      const valid = await db.category.findMany({
        where: { id: { in: (b.categoryIds || []).map(Number) } },
        select: { id: true },
      })
      validCatIds = valid.map((c) => c.id)
      if (!validCatIds.length) return res.status(422).json({ error: 'Selected categories no longer exist' })
    }

    const slug = b.slug?.trim()
      ? await uniqueSlug('post', b.slug, existing?.id)
      : existing?.slug || (await uniqueSlug('post', b.title))

    let bannerImage = existing?.bannerImage || null
    if (b.removeBanner) { removeFile(bannerImage); bannerImage = null }
    if (b.bannerImage && b.bannerImage !== bannerImage) {
      if (bannerImage) removeFile(bannerImage)
      bannerImage = b.bannerImage // already uploaded via /upload
    }

    const data = {
      title: b.title.trim(),
      slug,
      content: b.content,
      bannerImage,
      type,
      tags: type === 'post' ? b.tags || null : null,
      sortOrder: Number(b.sortOrder) || 0,
      publishedAt: b.publishedAt ? new Date(b.publishedAt) : existing?.publishedAt || new Date(),
      metaTitle: b.metaTitle || null,
      metaDescription: b.metaDescription || null,
      status: !!b.status,
      updatedBy: req.user.id,
    }

    let post
    if (isUpdate) {
      post = await db.post.update({ where: { id: existing.id }, data })
      if (type === 'post') {
        await db.categoryPost.deleteMany({ where: { postId: post.id } })
      }
    } else {
      post = await db.post.create({ data: { ...data, createdBy: req.user.id } })
    }
    if (type === 'post' && validCatIds.length) {
      await db.categoryPost.createMany({
        data: validCatIds.map((categoryId) => ({ postId: post.id, categoryId })),
        skipDuplicates: true,
      })
    }

    revalidate(postPaths(post))
    if (isUpdate && existing.slug !== post.slug) revalidate(postPaths(existing))
    res.json(post)
  }
}

async function postGetOne(req, res, type) {
  const post = await db.post.findFirst({
    where: { id: Number(req.params.id), type, ...notTrashed },
    include: { categories: { select: { categoryId: true } } },
  })
  if (!post) return res.status(404).json({ error: 'Not found' })
  res.json({ ...post, categoryIds: post.categories.map((c) => c.categoryId) })
}

for (const type of ['post', 'page']) {
  const base = type === 'post' ? '/posts' : '/pages'
  router.get(base, postListHandler(type))
  router.get(`${base}/:id`, (req, res) => postGetOne(req, res, type))
  router.post(base, postSaveHandler(type, false))
  router.put(`${base}/:id`, postSaveHandler(type, true))
  router.delete(`${base}/:id`, async (req, res) => {
    const post = await db.post.findFirst({ where: { id: Number(req.params.id), type, ...notTrashed } })
    if (!post) return res.status(404).json({ error: 'Not found' })
    await db.post.update({ where: { id: post.id }, data: { deletedAt: new Date() } })
    revalidate(postPaths(post))
    res.json({ ok: true })
  })
}

// ---- categories ----
router.get('/categories', async (req, res) => {
  const cats = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: { parent: { select: { name: true } }, _count: { select: { posts: true } } },
  })
  res.json(cats)
})

router.post('/categories', async (req, res) => {
  const { name, description, parentId, bannerImage, status } = req.body || {}
  if (!name?.trim()) return res.status(422).json({ error: 'Name is required' })
  const cat = await db.category.create({
    data: {
      name: name.trim(),
      slug: await uniqueSlug('category', name),
      description: description || null,
      parentId: parentId ? Number(parentId) : null,
      bannerImage: bannerImage || null,
      status: status !== false,
    },
  })
  revalidate(['/'])
  res.json(cat)
})

router.put('/categories/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { name, description, parentId, bannerImage, removeBanner, status } = req.body || {}
  if (!name?.trim()) return res.status(422).json({ error: 'Name is required' })
  if (Number(parentId) === id) return res.status(422).json({ error: 'A category cannot be its own parent' })
  let banner = existing.bannerImage
  if (removeBanner) { removeFile(banner); banner = null }
  if (bannerImage && bannerImage !== banner) { if (banner) removeFile(banner); banner = bannerImage }
  const cat = await db.category.update({
    where: { id },
    data: {
      name: name.trim(), description: description || null,
      parentId: parentId ? Number(parentId) : null,
      bannerImage: banner, status: status !== false,
    },
  })
  revalidate(['/', `/category/${cat.slug}`])
  res.json(cat)
})

router.delete('/categories/:id', async (req, res) => {
  const cat = await db.category.findUnique({ where: { id: Number(req.params.id) } })
  if (!cat) return res.status(404).json({ error: 'Not found' })
  await db.category.delete({ where: { id: cat.id } }) // hard delete, matches reference
  revalidate(['/', `/category/${cat.slug}`])
  res.json({ ok: true })
})

// ---- menus (admin only) ----
router.get('/menus', adminOnly, async (req, res) => {
  const [menus, posts, pages, cats] = await Promise.all([
    db.menu.findMany({ orderBy: { order: 'asc' } }),
    db.post.findMany({ where: { type: 'post', ...notTrashed }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    db.post.findMany({ where: { type: 'page', ...notTrashed }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    db.category.findMany({ select: { id: true, name: true, parentId: true }, orderBy: { name: 'asc' } }),
  ])
  const build = (parentId) =>
    menus.filter((m) => m.parentId === parentId).map((m) => ({ ...m, children: build(m.id) }))
  res.json({ tree: build(null), posts, pages, categories: cats })
})

// PUT replaces the whole tree (simplest contract for a drag-drop builder)
router.put('/menus', adminOnly, async (req, res) => {
  const items = req.body?.tree
  if (!Array.isArray(items)) return res.status(422).json({ error: 'Invalid menu tree' })
  await db.menu.deleteMany({})
  async function insert(nodes, parentId, depth) {
    if (depth > 3) return
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      if (!n.title?.trim() || !['custom', 'post', 'page', 'category'].includes(n.type)) continue
      const created = await db.menu.create({
        data: {
          title: n.title.trim(), type: n.type,
          url: n.type === 'custom' ? n.url || '#' : null,
          refId: n.type === 'custom' ? null : Number(n.refId) || null,
          parentId, order: i, newWindow: !!n.newWindow,
        },
      })
      if (n.children?.length) await insert(n.children, created.id, depth + 1)
    }
  }
  await insert(items, null, 1)
  revalidate(['/'])
  res.json({ ok: true })
})

// ---- users / staff (admin only) ----
router.get('/users', adminOnly, async (req, res) => {
  const users = await db.user.findMany({
    where: notTrashed,
    select: { id: true, name: true, email: true, mobile: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(users)
})

async function validateUser(b, ignoreId = null) {
  if (!b.name?.trim()) return 'Name is required'
  if (!/^\S+@\S+\.\S+$/.test(b.email || '')) return 'Valid email is required'
  if (b.mobile && !/^\d{10}$/.test(b.mobile)) return 'Mobile must be 10 digits'
  if (!['admin', 'manager'].includes(b.role)) return 'Invalid role'
  const emailClash = await db.user.findFirst({ where: { email: b.email, ...(ignoreId ? { id: { not: ignoreId } } : {}) } })
  if (emailClash) return 'Email already in use'
  if (b.mobile) {
    const mobileClash = await db.user.findFirst({ where: { mobile: b.mobile, ...(ignoreId ? { id: { not: ignoreId } } : {}) } })
    if (mobileClash) return 'Mobile already in use'
  }
  return null
}

router.post('/users', adminOnly, async (req, res) => {
  const b = req.body || {}
  const err = await validateUser(b)
  if (err) return res.status(422).json({ error: err })
  if (!b.password || b.password.length < 8) return res.status(422).json({ error: 'Password must be at least 8 characters' })
  const user = await db.user.create({
    data: {
      name: b.name.trim(), email: b.email, mobile: b.mobile || null,
      password: await bcrypt.hash(b.password, 10), role: b.role, status: b.status !== false,
    },
  })
  res.json({ id: user.id })
})

router.put('/users/:id', adminOnly, async (req, res) => {
  const id = Number(req.params.id)
  const b = req.body || {}
  const err = await validateUser(b, id)
  if (err) return res.status(422).json({ error: err })
  const data = { name: b.name.trim(), email: b.email, mobile: b.mobile || null, role: b.role, status: b.status !== false }
  if (b.password) {
    if (b.password.length < 8) return res.status(422).json({ error: 'Password must be at least 8 characters' })
    data.password = await bcrypt.hash(b.password, 10)
  }
  await db.user.update({ where: { id }, data })
  res.json({ ok: true })
})

router.delete('/users/:id', adminOnly, async (req, res) => {
  const id = Number(req.params.id)
  if (id === req.user.id) return res.status(422).json({ error: "You can't delete your own account" })
  await db.user.update({ where: { id }, data: { deletedAt: new Date() } })
  res.json({ ok: true })
})

// ---- settings (admin only) ----
router.get('/settings', adminOnly, async (req, res) => {
  const rows = await db.option.findMany()
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])))
})

router.put('/settings', adminOnly, async (req, res) => {
  const entries = Object.entries(req.body || {}).filter(([k]) => /^[a-z0-9_]+$/.test(k))
  for (const [key, value] of entries) {
    await db.option.upsert({ where: { key }, create: { key, value: String(value ?? '') }, update: { value: String(value ?? '') } })
  }
  revalidate(['/', '/robots.txt'])
  res.json({ ok: true })
})

// ---- banners ----
router.get('/banners', async (req, res) => {
  res.json(await db.media.findMany({ where: notTrashed, orderBy: { id: 'desc' } }))
})

router.post('/banners', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(422).json({ error: 'No image uploaded' })
  const url = await saveImage(req.file, { maxWidth: 1920 })
  const banner = await db.media.create({ data: { name: req.file.originalname, file: url } })
  revalidate(['/'])
  res.json(banner)
})

router.delete('/banners/:id', async (req, res) => {
  await db.media.update({ where: { id: Number(req.params.id) }, data: { deletedAt: new Date() } })
  revalidate(['/'])
  res.json({ ok: true })
})

// ---- recycle bin (admin only) ----
const TRASH = {
  posts: { model: 'post', where: { type: 'post' } },
  pages: { model: 'post', where: { type: 'page' } },
  users: { model: 'user', where: {} },
  banners: { model: 'media', where: {} },
}

router.get('/trash/:type', adminOnly, async (req, res) => {
  const t = TRASH[req.params.type]
  if (!t) return res.status(404).json({ error: 'Unknown type' })
  const items = await db[t.model].findMany({
    where: { ...t.where, deletedAt: { not: null } },
    orderBy: { deletedAt: 'desc' },
  })
  res.json(items.map(({ password, ...rest }) => rest))
})

router.post('/trash/:type/restore', adminOnly, async (req, res) => {
  const t = TRASH[req.params.type]
  if (!t) return res.status(404).json({ error: 'Unknown type' })
  const ids = (req.body?.ids || []).map(Number)
  if (!ids.length) return res.status(422).json({ error: 'No items selected' })
  await db[t.model].updateMany({ where: { id: { in: ids }, ...t.where }, data: { deletedAt: null } })
  revalidate(['/'])
  res.json({ ok: true })
})

router.delete('/trash/:type', adminOnly, async (req, res) => {
  const t = TRASH[req.params.type]
  if (!t) return res.status(404).json({ error: 'Unknown type' })
  const ids = (req.body?.ids || []).map(Number)
  if (!ids.length) return res.status(422).json({ error: 'No items selected' })
  const items = await db[t.model].findMany({ where: { id: { in: ids }, ...t.where, deletedAt: { not: null } } })
  for (const item of items) removeFile(item.bannerImage || item.file)
  await db[t.model].deleteMany({ where: { id: { in: items.map((i) => i.id) } } })
  res.json({ ok: true })
})

export default router
