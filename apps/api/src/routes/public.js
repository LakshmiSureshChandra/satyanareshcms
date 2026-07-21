import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { db, notTrashed, publishedNow } from '../lib/db.js'
import { sendMail } from '../lib/mailer.js'
import { revalidate } from '../lib/revalidate.js'

const router = Router()

const postCard = {
  id: true, title: true, slug: true, bannerImage: true, publishedAt: true, tags: true,
  metaDescription: true,
  categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
}

const flatten = (p) => ({ ...p, categories: p.categories.map((c) => c.category) })

// all ids in a category's subtree (itself + every descendant, any depth)
async function categoryAndDescendantIds(rootId) {
  const all = await db.category.findMany({ select: { id: true, parentId: true } })
  const ids = [rootId]
  let frontier = [rootId]
  while (frontier.length) {
    frontier = all.filter((c) => frontier.includes(c.parentId)).map((c) => c.id)
    ids.push(...frontier)
  }
  return ids
}

// when browsing a category page, a post tagged with both the category and one
// of its subcategories should show the subcategory badge (the more specific,
// more useful reference) rather than whichever category happens to be first
function preferSubcategoryBadge(posts, viewedId, subtreeIds) {
  const subtreeSet = new Set(subtreeIds)
  return posts.map((p) => {
    const specific = p.categories.find((c) => subtreeSet.has(c.id) && c.id !== viewedId)
    const preferred = specific || p.categories.find((c) => subtreeSet.has(c.id)) || p.categories[0]
    if (!preferred) return p
    return { ...p, categories: [preferred, ...p.categories.filter((c) => c !== preferred)] }
  })
}

async function getSettings() {
  const rows = await db.option.findMany()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

// public settings whitelist — never expose everything
const PUBLIC_SETTINGS = [
  'site_name', 'site_logo', 'fav_icon', 'site_email', 'site_phone', 'google_analytics',
  'facebook_link', 'twitter_link', 'linkedin_link', 'instagram_link', 'youtube_link',
  'copy_rights_info', 'footer_config',
  'default_meta_description', 'google_site_verification', 'og_image',
  'gallery_enabled',
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

  let cat = null
  let subtreeIds = null
  if (category) {
    cat = await db.category.findUnique({ where: { slug: String(category) } })
    if (!cat) return res.status(404).json({ error: 'Category not found' })
    subtreeIds = await categoryAndDescendantIds(cat.id)
    where.categories = { some: { categoryId: { in: subtreeIds } } }
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
  let flattened = posts.map(flatten)
  if (cat) flattened = preferSubcategoryBadge(flattened, cat.id, subtreeIds)
  res.json({ posts: flattened, total, page, pages: Math.ceil(total / limit) })
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
  const settings = await getSettings()
  const galleryOn = settings.gallery_enabled === 'true'
  const [posts, cats, galleryAlbums] = await Promise.all([
    db.post.findMany({
      where: publishedNow(),
      select: { slug: true, type: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
    }),
    db.category.findMany({ where: { status: true }, select: { slug: true, updatedAt: true } }),
    galleryOn
      ? db.galleryAlbum.findMany({
          where: { ...publishedNow(), category: { status: true } },
          select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
        })
      : [],
  ])
  res.json({
    posts, categories: cats,
    galleryAlbums: galleryAlbums.filter((a) => a.category).map((a) => ({ slug: `${a.category.slug}/${a.slug}`, updatedAt: a.updatedAt })),
  })
})

// ---- gallery (public): Gallery -> Category -> Album -> paginated Photos ----
const albumCard = { id: true, title: true, slug: true, coverImage: true, publishedAt: true, _count: { select: { photos: true } } }
const flattenAlbum = (a) => ({ ...a, photoCount: a._count.photos, _count: undefined })
const PHOTOS_PER_PAGE = 20

async function galleryEnabled() {
  const settings = await getSettings()
  return settings.gallery_enabled === 'true'
}

// all ids in a gallery category's subtree (itself + every descendant, any depth)
async function galleryCategoryAndDescendantIds(rootId) {
  const all = await db.galleryCategory.findMany({ select: { id: true, parentId: true } })
  const ids = [rootId]
  let frontier = [rootId]
  while (frontier.length) {
    frontier = all.filter((c) => frontier.includes(c.parentId)).map((c) => c.id)
    ids.push(...frontier)
  }
  return ids
}

// top-level categories (parentId null) that have at least one published album
// in their own subtree — album count/cover roll up from child categories too
router.get('/gallery', async (req, res) => {
  if (!(await galleryEnabled())) return res.status(404).json({ error: 'Not found' })
  const topLevel = await db.galleryCategory.findMany({
    where: { status: true, parentId: null },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, slug: true },
  })
  const result = []
  for (const c of topLevel) {
    const subtreeIds = await galleryCategoryAndDescendantIds(c.id)
    const where = { categoryId: { in: subtreeIds }, ...publishedNow() }
    const [albumCount, cover, children] = await Promise.all([
      db.galleryAlbum.count({ where }),
      db.galleryAlbum.findFirst({ where, orderBy: { publishedAt: 'desc' }, select: { coverImage: true } }),
      db.galleryCategory.findMany({ where: { parentId: c.id, status: true }, select: { id: true, name: true, slug: true } }),
    ])
    if (albumCount === 0) continue
    result.push({ id: c.id, name: c.name, slug: c.slug, coverImage: cover?.coverImage || null, albumCount, children })
  }
  res.json(result)
})

router.get('/gallery/:categorySlug', async (req, res) => {
  if (!(await galleryEnabled())) return res.status(404).json({ error: 'Not found' })
  const category = await db.galleryCategory.findFirst({
    where: { slug: req.params.categorySlug, status: true },
    include: { parent: { select: { name: true, slug: true } } },
  })
  if (!category) return res.status(404).json({ error: 'Not found' })
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = 12
  const subtreeIds = await galleryCategoryAndDescendantIds(category.id)
  const where = { categoryId: { in: subtreeIds }, ...publishedNow() }
  const [total, albums, children] = await Promise.all([
    db.galleryAlbum.count({ where }),
    db.galleryAlbum.findMany({
      where, orderBy: { publishedAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      select: { ...albumCard, category: { select: { id: true, name: true, slug: true } } },
    }),
    db.galleryCategory.findMany({ where: { parentId: category.id, status: true }, select: { id: true, name: true, slug: true } }),
  ])
  res.json({
    category: { name: category.name, slug: category.slug, description: category.description, parent: category.parent },
    children,
    albums: albums.map(flattenAlbum),
    total, page, pages: Math.ceil(total / limit),
  })
})

router.get('/gallery/:categorySlug/:albumSlug', async (req, res) => {
  if (!(await galleryEnabled())) return res.status(404).json({ error: 'Not found' })
  const album = await db.galleryAlbum.findFirst({
    where: { slug: req.params.albumSlug, ...publishedNow(), category: { slug: req.params.categorySlug, status: true } },
    include: { category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } } },
  })
  if (!album) return res.status(404).json({ error: 'Not found' })
  const page = Math.max(1, Number(req.query.page) || 1)
  const [totalPhotos, photos, related, moreFromGallery] = await Promise.all([
    db.galleryPhoto.count({ where: { albumId: album.id } }),
    db.galleryPhoto.findMany({
      where: { albumId: album.id }, orderBy: { sortOrder: 'asc' },
      skip: (page - 1) * PHOTOS_PER_PAGE, take: PHOTOS_PER_PAGE,
    }),
    album.categoryId
      ? db.galleryAlbum.findMany({
          where: { categoryId: album.categoryId, id: { not: album.id }, ...publishedNow() },
          orderBy: { publishedAt: 'desc' }, take: 4,
          select: { ...albumCard, category: { select: { id: true, name: true, slug: true } } },
        })
      : [],
    db.galleryAlbum.findMany({
      where: { categoryId: { not: album.categoryId }, id: { not: album.id }, ...publishedNow(), category: { status: true } },
      orderBy: { publishedAt: 'desc' }, take: 4,
      select: { ...albumCard, category: { select: { id: true, name: true, slug: true } } },
    }),
  ])
  res.json({
    ...album, photos, photoPage: page, photoPages: Math.ceil(totalPhotos / PHOTOS_PER_PAGE), totalPhotos,
    related: related.map(flattenAlbum),
    moreFromGallery: moreFromGallery.map(flattenAlbum),
  })
})

// ---- polls: one active poll voted on publicly, archived ones viewable read-only ----
const VOTE_COOKIE = 'voted_polls'
const voteCookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: (process.env.WEB_URL || '').startsWith('https'),
  maxAge: 365 * 24 * 3600 * 1000,
  path: '/',
}

function votedIds(req) {
  return String(req.cookies?.[VOTE_COOKIE] || '').split(',').filter(Boolean).map(Number)
}

function flattenPoll(poll, hasVoted) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0)
  return { id: poll.id, title: poll.title, totalVotes, hasVoted, options: poll.options.map((o) => ({ id: o.id, text: o.text, votes: o.votes })) }
}

router.get('/polls/active', async (req, res) => {
  const poll = await db.poll.findFirst({
    where: { status: true, ...notTrashed },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!poll) return res.status(404).json({ error: 'Not found' })
  res.json(flattenPoll(poll, votedIds(req).includes(poll.id)))
})

router.post('/polls/:id/vote', async (req, res) => {
  const id = Number(req.params.id)
  const poll = await db.poll.findFirst({ where: { id, status: true, ...notTrashed }, include: { options: true } })
  if (!poll) return res.status(404).json({ error: 'Not found' })
  if (votedIds(req).includes(id)) return res.status(409).json({ error: 'You have already voted in this poll' })
  const optionId = Number(req.body?.optionId)
  if (!poll.options.some((o) => o.id === optionId)) return res.status(422).json({ error: 'Invalid option' })
  await db.pollOption.update({ where: { id: optionId }, data: { votes: { increment: 1 } } })
  const updated = await db.poll.findUnique({ where: { id }, include: { options: { orderBy: { sortOrder: 'asc' } } } })
  res.cookie(VOTE_COOKIE, [...votedIds(req), id].join(','), voteCookieOpts)
  revalidate(['/'])
  res.json(flattenPoll(updated, true))
})

router.get('/polls', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = 10
  const where = { status: false, ...notTrashed }
  if (/^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '')) {
    const start = new Date(`${req.query.date}T00:00:00`)
    const end = new Date(start.getTime() + 24 * 3600 * 1000)
    where.createdAt = { gte: start, lt: end }
  } else if (/^\d{4}-\d{2}$/.test(req.query.month || '')) {
    const [y, m] = req.query.month.split('-').map(Number)
    where.createdAt = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) }
  }
  const [total, polls] = await Promise.all([
    db.poll.count({ where }),
    db.poll.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, select: { id: true, title: true, createdAt: true } }),
  ])
  res.json({ polls, total, page, pages: Math.ceil(total / limit) })
})

router.get('/polls/:id', async (req, res) => {
  const poll = await db.poll.findFirst({
    where: { id: Number(req.params.id), ...notTrashed },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!poll) return res.status(404).json({ error: 'Not found' })
  res.json(flattenPoll(poll, votedIds(req).includes(poll.id)))
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
