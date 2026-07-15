import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { db, notTrashed, publishedNow } from '../lib/db.js'
import { sendMail } from '../lib/mailer.js'

const router = Router()

const postCard = {
  id: true, title: true, slug: true, bannerImage: true, publishedAt: true, tags: true,
  metaDescription: true,
  categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
}

const flatten = (p) => ({ ...p, categories: p.categories.map((c) => c.category) })

async function getSettings() {
  const rows = await db.option.findMany()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

// public settings whitelist — never expose everything
const PUBLIC_SETTINGS = [
  'site_name', 'site_logo', 'fav_icon', 'site_email', 'site_phone', 'google_analytics',
  'facebook_link', 'twitter_link', 'linkedin_link', 'instagram_link', 'youtube_link',
  'copy_rights_info', 'footer_config',
]

router.get('/settings', async (req, res) => {
  const all = await getSettings()
  res.json(Object.fromEntries(PUBLIC_SETTINGS.map((k) => [k, all[k] ?? ''])))
})

async function resolveMenu(location) {
  const menus = await db.menu.findMany({ where: { location }, orderBy: { order: 'asc' } })
  const postIds = menus.filter((m) => m.type === 'post' || m.type === 'page').map((m) => m.refId).filter(Boolean)
  const catIds = menus.filter((m) => m.type === 'category').map((m) => m.refId).filter(Boolean)
  const [posts, cats] = await Promise.all([
    db.post.findMany({ where: { id: { in: postIds } }, select: { id: true, slug: true, type: true } }),
    db.category.findMany({ where: { id: { in: catIds } }, select: { id: true, slug: true } }),
  ])
  const postMap = new Map(posts.map((p) => [p.id, p]))
  const catMap = new Map(cats.map((c) => [c.id, c]))
  const link = (m) => {
    if (m.type === 'custom') return m.url || '#'
    if (m.type === 'category') return catMap.has(m.refId) ? `/category/${catMap.get(m.refId).slug}` : '#'
    const p = postMap.get(m.refId)
    if (!p) return '#'
    if (p.slug === 'home') return '/'
    return p.type === 'page' ? `/page/${p.slug}` : `/${p.slug}`
  }
  const build = (parentId) =>
    menus.filter((m) => m.parentId === parentId).map((m) => ({
      id: m.id, title: m.title, url: link(m), newWindow: m.newWindow, children: build(m.id),
    }))
  return build(null)
}

router.get('/menus', async (req, res) => {
  res.json(await resolveMenu(req.query.location === 'footer' ? 'footer' : 'header'))
})

router.get('/categories', async (req, res) => {
  // full active tree (3 levels) with post counts on leaves
  const cats = await db.category.findMany({
    where: { status: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, parentId: true, _count: { select: { posts: true } } },
  })
  const build = (parentId) =>
    cats.filter((c) => c.parentId === parentId).map((c) => ({
      id: c.id, name: c.name, slug: c.slug, postCount: c._count.posts, children: build(c.id),
    }))
  res.json(build(null))
})

router.get('/home', async (req, res) => {
  const settings = await getSettings()
  const heroCat = Number(settings.home_hero_category_id) || null
  const featCat = Number(settings.home_featured_category_id) || null
  const pub = publishedNow()

  const inCategory = (catId) => (catId ? { categories: { some: { categoryId: catId } } } : {})

  const [hero, featured, latest, banners] = await Promise.all([
    db.post.findMany({
      where: { ...pub, type: 'post', ...inCategory(heroCat) },
      orderBy: { publishedAt: 'desc' }, take: 5, select: postCard,
    }),
    db.post.findMany({
      where: { ...pub, type: 'post', ...inCategory(featCat) },
      orderBy: { publishedAt: 'desc' }, take: 10, select: postCard,
    }),
    db.post.findMany({
      where: { ...pub, type: 'post' },
      orderBy: { publishedAt: 'desc' }, take: 15, select: postCard,
    }),
    db.media.findMany({ where: notTrashed, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
  ])

  // "more posts" grid = latest overflow beyond the first 6 (replaces reference's random posts — deterministic, ISR-friendly)
  res.json({
    hero: hero.map(flatten),
    featured: featured.map(flatten),
    latest: latest.slice(0, 6).map(flatten),
    more: latest.slice(6).map(flatten),
    banners,
  })
})

router.get('/posts', async (req, res) => {
  const { category, tag, q } = req.query
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Number(req.query.limit) || 12)
  const where = { ...publishedNow(), type: 'post' }

  if (category) {
    const cat = await db.category.findUnique({ where: { slug: String(category) } })
    if (!cat) return res.status(404).json({ error: 'Category not found' })
    where.categories = { some: { categoryId: cat.id } }
  }
  if (tag) where.tags = { contains: String(tag) }
  if (q) where.OR = [{ title: { contains: String(q) } }, { content: { contains: String(q) } }]

  const [total, posts] = await Promise.all([
    db.post.count({ where }),
    db.post.findMany({
      where, orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit, take: limit, select: postCard,
    }),
  ])
  res.json({ posts: posts.map(flatten), total, page, pages: Math.ceil(total / limit) })
})

router.get('/posts/:slug', async (req, res) => {
  const post = await db.post.findFirst({
    where: { slug: req.params.slug, type: 'post', ...publishedNow() },
    include: {
      author: { select: { name: true } },
      categories: { select: { category: { select: { id: true, name: true, slug: true, parentId: true, parent: { select: { name: true, slug: true } } } } } },
    },
  })
  if (!post) return res.status(404).json({ error: 'Not found' })

  db.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {})

  const catIds = post.categories.map((c) => c.category.id)
  const related = catIds.length
    ? await db.post.findMany({
        where: {
          ...publishedNow(), type: 'post', id: { not: post.id },
          categories: { some: { categoryId: { in: catIds } } },
        },
        orderBy: { publishedAt: 'desc' }, take: 4, select: postCard,
      })
    : []

  res.json({ ...post, categories: post.categories.map((c) => c.category), related: related.map(flatten) })
})

router.get('/pages/:slug', async (req, res) => {
  const page = await db.post.findFirst({
    where: { slug: req.params.slug, type: 'page', status: true, ...notTrashed },
  })
  if (!page) return res.status(404).json({ error: 'Not found' })
  res.json(page)
})

router.get('/categories/:slug', async (req, res) => {
  const cat = await db.category.findFirst({
    where: { slug: req.params.slug, status: true },
    include: { parent: { select: { name: true, slug: true } } },
  })
  if (!cat) return res.status(404).json({ error: 'Not found' })
  res.json(cat)
})

router.get('/sitemap-data', async (req, res) => {
  const [posts, cats] = await Promise.all([
    db.post.findMany({
      where: publishedNow(),
      select: { slug: true, type: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
    }),
    db.category.findMany({ where: { status: true }, select: { slug: true, updatedAt: true } }),
  ])
  res.json({ posts, categories: cats })
})

router.get('/robots', async (req, res) => {
  const all = await getSettings()
  res.type('text/plain').send(all.robot_txt || 'User-agent: *\nAllow: /')
})

const contactLimiter = rateLimit({ windowMs: 3600 * 1000, limit: 5 })
router.post('/contact', contactLimiter, async (req, res) => {
  const { name, email, company, phone, message } = req.body || {}
  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email))
    return res.status(422).json({ error: 'Name and a valid email are required' })
  if (message && message.length > 500) return res.status(422).json({ error: 'Message too long (500 chars max)' })

  const settings = await getSettings()
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const recipient = process.env.CONTACT_EMAIL || settings.site_email || 'mail@akganesh.in'
  try {
    await sendMail({
      to: recipient,
      replyTo: email,
      subject: `Contact form: ${esc(name)}`,
      html: `<table>
        <tr><td><b>Name</b></td><td>${esc(name)}</td></tr>
        <tr><td><b>Email</b></td><td>${esc(email)}</td></tr>
        <tr><td><b>Company</b></td><td>${esc(company)}</td></tr>
        <tr><td><b>Phone</b></td><td>${esc(phone)}</td></tr>
        <tr><td><b>Message</b></td><td>${esc(message).replace(/\n/g, '<br>')}</td></tr>
      </table>`,
    })
  } catch (e) {
    console.error('Contact email failed:', e.message)
    return res.status(500).json({ error: 'Could not send your message. Please try again later.' })
  }
  res.json({ ok: true })
})

export default router
