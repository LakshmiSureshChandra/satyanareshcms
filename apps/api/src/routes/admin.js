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
  // bulk soft-delete (move many to recycle bin)
  router.post(`${base}/bulk-delete`, async (req, res) => {
    const ids = (req.body?.ids || []).map(Number).filter(Boolean)
    if (!ids.length) return res.status(422).json({ error: 'No items selected' })
    const posts = await db.post.findMany({ where: { id: { in: ids }, type, ...notTrashed } })
    await db.post.updateMany({ where: { id: { in: posts.map((p) => p.id) } }, data: { deletedAt: new Date() } })
    revalidate(['/'])
    res.json({ ok: true, count: posts.length })
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
  const { name, description, parentId, status } = req.body || {}
  if (!name?.trim()) return res.status(422).json({ error: 'Name is required' })
  const cat = await db.category.create({
    data: {
      name: name.trim(),
      slug: await uniqueSlug('category', name),
      description: description || null,
      parentId: parentId ? Number(parentId) : null,
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
  const { name, description, parentId, status } = req.body || {}
  if (!name?.trim()) return res.status(422).json({ error: 'Name is required' })
  if (Number(parentId) === id) return res.status(422).json({ error: 'A category cannot be its own parent' })
  const cat = await db.category.update({
    where: { id },
    data: {
      name: name.trim(), description: description || null,
      parentId: parentId ? Number(parentId) : null,
      status: status !== false,
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

// ---- menus (admin only) — location is "header" (nav) or "footer" (columns) ----
const menuLocation = (req) => (req.query.location === 'footer' ? 'footer' : 'header')

router.get('/menus', adminOnly, async (req, res) => {
  const location = menuLocation(req)
  const [menus, posts, pages, cats] = await Promise.all([
    db.menu.findMany({ where: { location }, orderBy: { order: 'asc' } }),
    db.post.findMany({ where: { type: 'post', ...notTrashed }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    db.post.findMany({ where: { type: 'page', ...notTrashed }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    db.category.findMany({ select: { id: true, name: true, parentId: true }, orderBy: { name: 'asc' } }),
  ])
  const build = (parentId) =>
    menus.filter((m) => m.parentId === parentId).map((m) => ({ ...m, children: build(m.id) }))
  res.json({ tree: build(null), posts, pages, categories: cats })
})

// PUT replaces the whole tree for one location (simplest drag-drop contract)
router.put('/menus', adminOnly, async (req, res) => {
  const location = menuLocation(req)
  const items = req.body?.tree
  if (!Array.isArray(items)) return res.status(422).json({ error: 'Invalid menu tree' })
  await db.menu.deleteMany({ where: { location } })
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
          parentId, order: i, newWindow: !!n.newWindow, location,
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

// ---- banners (ordered by sortOrder) ----
router.get('/banners', async (req, res) => {
  res.json(await db.media.findMany({ where: notTrashed, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }))
})

router.post('/banners', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(422).json({ error: 'No image uploaded' })
  const url = await saveImage(req.file, { maxWidth: 1920 })
  const max = await db.media.aggregate({ _max: { sortOrder: true }, where: notTrashed })
  const banner = await db.media.create({
    data: { name: req.file.originalname, file: url, sortOrder: (max._max.sortOrder ?? 0) + 1 },
  })
  revalidate(['/'])
  res.json(banner)
})

// persist a new order: body { ids: [in display order] }
router.put('/banners/order', async (req, res) => {
  const ids = (req.body?.ids || []).map(Number).filter(Boolean)
  await Promise.all(ids.map((id, i) => db.media.update({ where: { id }, data: { sortOrder: i } })))
  revalidate(['/'])
  res.json({ ok: true })
})

router.delete('/banners/:id', async (req, res) => {
  await db.media.update({ where: { id: Number(req.params.id) }, data: { deletedAt: new Date() } })
  revalidate(['/'])
  res.json({ ok: true })
})

// ---- gallery: categories -> albums -> photos (admin + manager) ----
// resolve the public URL(s) for an album, for cache revalidation
async function albumPaths(album) {
  if (!album?.categoryId) return ['/gallery']
  const cat = await db.galleryCategory.findUnique({ where: { id: album.categoryId } })
  return cat ? ['/gallery', `/gallery/${cat.slug}`, `/gallery/${cat.slug}/${album.slug}`] : ['/gallery']
}

// -- categories (route BEFORE /gallery/:id so "categories" isn't read as an id) --
router.get('/gallery/categories', async (req, res) => {
  const cats = await db.galleryCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { parent: { select: { name: true } }, _count: { select: { albums: true } } },
  })
  res.json(cats.map((c) => ({ ...c, albumCount: c._count.albums, _count: undefined })))
})

router.post('/gallery/categories', async (req, res) => {
  const { name, description, status, parentId } = req.body || {}
  if (!name?.trim()) return res.status(422).json({ error: 'Name is required' })
  const max = await db.galleryCategory.aggregate({ _max: { sortOrder: true } })
  const cat = await db.galleryCategory.create({
    data: {
      name: name.trim(),
      slug: await uniqueSlug('galleryCategory', name),
      description: description || null,
      status: status !== false,
      parentId: parentId ? Number(parentId) : null,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  })
  revalidate(['/gallery'])
  res.json(cat)
})

router.put('/gallery/categories/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existing = await db.galleryCategory.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { name, description, status, parentId } = req.body || {}
  if (!name?.trim()) return res.status(422).json({ error: 'Name is required' })
  if (Number(parentId) === id) return res.status(422).json({ error: 'A category cannot be its own parent' })
  const cat = await db.galleryCategory.update({
    where: { id },
    data: { name: name.trim(), description: description || null, status: status !== false, parentId: parentId ? Number(parentId) : null },
  })
  revalidate(['/gallery', `/gallery/${existing.slug}`, `/gallery/${cat.slug}`])
  res.json(cat)
})

router.delete('/gallery/categories/:id', async (req, res) => {
  const cat = await db.galleryCategory.findUnique({ where: { id: Number(req.params.id) } })
  if (!cat) return res.status(404).json({ error: 'Not found' })
  await db.galleryCategory.delete({ where: { id: cat.id } }) // albums keep existing (category set to null via FK)
  revalidate(['/gallery', `/gallery/${cat.slug}`])
  res.json({ ok: true })
})

// -- albums --
router.get('/gallery', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = 20
  const where = { ...notTrashed }
  if (req.query.s) {
    const s = String(req.query.s)
    // match the album's own title, or any photo caption inside it — so a
    // search for something only mentioned in a photo's caption still surfaces
    // the album it belongs to
    where.OR = [{ title: { contains: s } }, { photos: { some: { caption: { contains: s } } } }]
  }
  if (req.query.category) where.categoryId = Number(req.query.category)
  const [total, items] = await Promise.all([
    db.galleryAlbum.count({ where }),
    db.galleryAlbum.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      select: {
        id: true, title: true, slug: true, coverImage: true, status: true, publishedAt: true,
        category: { select: { id: true, name: true } },
        _count: { select: { photos: true } },
      },
    }),
  ])
  res.json({ items: items.map((a) => ({ ...a, photoCount: a._count.photos, _count: undefined })), total, page, pages: Math.ceil(total / limit) })
})

router.get('/gallery/:id', async (req, res) => {
  const album = await db.galleryAlbum.findFirst({
    where: { id: Number(req.params.id), ...notTrashed },
    include: { photos: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!album) return res.status(404).json({ error: 'Not found' })
  res.json(album)
})

function validateAlbum(b) {
  if (!b.title?.trim()) return 'Title is required'
  if (!b.categoryId) return 'Category is required'
  return null
}

router.post('/gallery', async (req, res) => {
  const err = validateAlbum(req.body)
  if (err) return res.status(422).json({ error: err })
  const b = req.body
  const category = await db.galleryCategory.findUnique({ where: { id: Number(b.categoryId) } })
  if (!category) return res.status(422).json({ error: 'Selected category no longer exists' })
  const album = await db.galleryAlbum.create({
    data: {
      title: b.title.trim(),
      slug: await uniqueSlug('galleryAlbum', b.slug?.trim() || b.title),
      coverImage: b.coverImage || null,
      status: !!b.status,
      publishedAt: b.publishedAt ? new Date(b.publishedAt) : new Date(),
      categoryId: category.id,
      createdBy: req.user.id,
    },
  })
  revalidate(await albumPaths(album))
  res.json(album)
})

router.put('/gallery/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existing = await db.galleryAlbum.findFirst({ where: { id, ...notTrashed } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const err = validateAlbum(req.body)
  if (err) return res.status(422).json({ error: err })
  const b = req.body
  const category = await db.galleryCategory.findUnique({ where: { id: Number(b.categoryId) } })
  if (!category) return res.status(422).json({ error: 'Selected category no longer exists' })
  let coverImage = existing.coverImage
  if (b.removeCover) { removeFile(coverImage); coverImage = null }
  if (b.coverImage && b.coverImage !== coverImage) { if (coverImage) removeFile(coverImage); coverImage = b.coverImage }
  const album = await db.galleryAlbum.update({
    where: { id },
    data: {
      title: b.title.trim(),
      slug: b.slug?.trim() ? await uniqueSlug('galleryAlbum', b.slug, id) : existing.slug,
      coverImage,
      status: !!b.status,
      publishedAt: b.publishedAt ? new Date(b.publishedAt) : existing.publishedAt,
      categoryId: category.id,
    },
  })
  revalidate([...(await albumPaths(existing)), ...(await albumPaths(album))])
  res.json(album)
})

router.delete('/gallery/:id', async (req, res) => {
  const album = await db.galleryAlbum.findFirst({ where: { id: Number(req.params.id), ...notTrashed } })
  if (!album) return res.status(404).json({ error: 'Not found' })
  await db.galleryAlbum.update({ where: { id: album.id }, data: { deletedAt: new Date() } })
  revalidate(await albumPaths(album))
  res.json({ ok: true })
})

// -- photos within an album — sub-resource, not individually trashed --
router.post('/gallery/:id/photos', upload.single('file'), async (req, res) => {
  const albumId = Number(req.params.id)
  const album = await db.galleryAlbum.findFirst({ where: { id: albumId, ...notTrashed } })
  if (!album) return res.status(404).json({ error: 'Not found' })
  if (!req.file) return res.status(422).json({ error: 'No image uploaded' })
  const url = await saveImage(req.file, { maxWidth: 2000 })
  const max = await db.galleryPhoto.aggregate({ _max: { sortOrder: true }, where: { albumId } })
  const photo = await db.galleryPhoto.create({
    data: { albumId, file: url, sortOrder: (max._max.sortOrder ?? 0) + 1 },
  })
  revalidate(await albumPaths(album))
  res.json(photo)
})

router.put('/gallery/:id/photos/order', async (req, res) => {
  const albumId = Number(req.params.id)
  const ids = (req.body?.ids || []).map(Number).filter(Boolean)
  await Promise.all(ids.map((id, i) => db.galleryPhoto.update({ where: { id }, data: { sortOrder: i } })))
  const album = await db.galleryAlbum.findUnique({ where: { id: albumId } })
  if (album) revalidate(await albumPaths(album))
  res.json({ ok: true })
})

// caption shown below the photo on the public page, and used as its alt/meta text
router.put('/gallery/:id/photos/:photoId', async (req, res) => {
  const photo = await db.galleryPhoto.findFirst({ where: { id: Number(req.params.photoId), albumId: Number(req.params.id) } })
  if (!photo) return res.status(404).json({ error: 'Not found' })
  const caption = String(req.body?.caption ?? '').slice(0, 191)
  const updated = await db.galleryPhoto.update({ where: { id: photo.id }, data: { caption: caption || null } })
  const album = await db.galleryAlbum.findUnique({ where: { id: Number(req.params.id) } })
  if (album) revalidate(await albumPaths(album))
  res.json(updated)
})

router.delete('/gallery/:id/photos/:photoId', async (req, res) => {
  const photo = await db.galleryPhoto.findFirst({ where: { id: Number(req.params.photoId), albumId: Number(req.params.id) } })
  if (!photo) return res.status(404).json({ error: 'Not found' })
  removeFile(photo.file)
  await db.galleryPhoto.delete({ where: { id: photo.id } })
  const album = await db.galleryAlbum.findUnique({ where: { id: Number(req.params.id) } })
  if (album) revalidate(await albumPaths(album))
  res.json({ ok: true })
})

// ---- polls: one active/published poll voted on publicly, rest archived read-only ----
router.get('/polls', async (req, res) => {
  const polls = await db.poll.findMany({
    where: notTrashed,
    orderBy: { createdAt: 'desc' },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  })
  res.json(polls)
})

router.get('/polls/:id', async (req, res) => {
  const poll = await db.poll.findFirst({
    where: { id: Number(req.params.id), ...notTrashed },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!poll) return res.status(404).json({ error: 'Not found' })
  res.json(poll)
})

function validatePoll(b) {
  if (!b.title?.trim()) return 'Title is required'
  const options = (b.options || []).map((o) => String(o).trim()).filter(Boolean)
  if (options.length < 2) return 'Add at least 2 options'
  return null
}

// setting a poll live means only one poll can ever be voted on at a time —
// every other poll is archived in the same transaction
async function archiveOthers(tx, exceptId) {
  await tx.poll.updateMany({ where: { id: { not: exceptId }, status: true }, data: { status: false } })
}

router.post('/polls', async (req, res) => {
  const err = validatePoll(req.body)
  if (err) return res.status(422).json({ error: err })
  const b = req.body
  const options = b.options.map((o) => String(o).trim()).filter(Boolean)
  const poll = await db.$transaction(async (tx) => {
    const created = await tx.poll.create({
      data: {
        title: b.title.trim(),
        status: !!b.status,
        options: { create: options.map((text, i) => ({ text, sortOrder: i })) },
      },
      include: { options: true },
    })
    if (created.status) await archiveOthers(tx, created.id)
    return created
  })
  revalidate(['/', '/polls'])
  res.json(poll)
})

router.put('/polls/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existing = await db.poll.findFirst({ where: { id, ...notTrashed } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status) return res.status(422).json({ error: 'Archive this poll before editing it — it is currently live and being voted on.' })
  const err = validatePoll(req.body)
  if (err) return res.status(422).json({ error: err })
  const b = req.body
  const options = b.options.map((o) => String(o).trim()).filter(Boolean)
  const poll = await db.$transaction(async (tx) => {
    // ponytail: options are replaced wholesale on edit (vote counts reset) — editing is
    // only reachable for already-archived polls, so this is a rare correction, not live data loss
    await tx.pollOption.deleteMany({ where: { pollId: id } })
    const updated = await tx.poll.update({
      where: { id },
      data: {
        title: b.title.trim(),
        status: !!b.status,
        options: { create: options.map((text, i) => ({ text, sortOrder: i })) },
      },
      include: { options: true },
    })
    if (updated.status) await archiveOthers(tx, id)
    return updated
  })
  revalidate(['/', '/polls'])
  res.json(poll)
})

// archive the live poll directly, without going through the full edit flow (which is locked while live)
router.put('/polls/:id/archive', async (req, res) => {
  const poll = await db.poll.findFirst({ where: { id: Number(req.params.id), ...notTrashed } })
  if (!poll) return res.status(404).json({ error: 'Not found' })
  if (!poll.status) return res.status(422).json({ error: 'Already archived' })
  const updated = await db.poll.update({ where: { id: poll.id }, data: { status: false } })
  revalidate(['/', '/polls'])
  res.json(updated)
})

router.delete('/polls/:id', async (req, res) => {
  const poll = await db.poll.findFirst({ where: { id: Number(req.params.id), ...notTrashed } })
  if (!poll) return res.status(404).json({ error: 'Not found' })
  await db.poll.update({ where: { id: poll.id }, data: { deletedAt: new Date() } })
  revalidate(['/', '/polls'])
  res.json({ ok: true })
})

// ---- recycle bin (admin only) ----
const TRASH = {
  posts: { model: 'post', where: { type: 'post' } },
  pages: { model: 'post', where: { type: 'page' } },
  users: { model: 'user', where: {} },
  banners: { model: 'media', where: {} },
  gallery: { model: 'galleryAlbum', where: {} },
  polls: { model: 'poll', where: {} },
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
  const data = { deletedAt: null }
  // a poll's "live" status must never come back silently — restoring always
  // lands it as archived; re-publishing is a deliberate, separate admin action
  if (req.params.type === 'polls') data.status = false
  await db[t.model].updateMany({ where: { id: { in: ids }, ...t.where }, data })
  revalidate(['/'])
  res.json({ ok: true })
})

router.delete('/trash/:type', adminOnly, async (req, res) => {
  const t = TRASH[req.params.type]
  if (!t) return res.status(404).json({ error: 'Unknown type' })
  const ids = (req.body?.ids || []).map(Number)
  if (!ids.length) return res.status(422).json({ error: 'No items selected' })
  const items = await db[t.model].findMany({ where: { id: { in: ids }, ...t.where, deletedAt: { not: null } } })
  if (req.params.type === 'gallery') {
    const photos = await db.galleryPhoto.findMany({ where: { albumId: { in: items.map((i) => i.id) } } })
    for (const p of photos) removeFile(p.file)
  }
  for (const item of items) removeFile(item.bannerImage || item.coverImage || item.file)
  await db[t.model].deleteMany({ where: { id: { in: items.map((i) => i.id) } } })
  res.json({ ok: true })
})

export default router
