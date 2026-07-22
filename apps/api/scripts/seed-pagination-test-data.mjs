// One-time: adds enough gallery data to actually trigger pagination so it can
// be tested/seen — 15 albums in one category (>12/page) and 25 photos in one
// album (>20/page). All clearly named "Pagination Test *" so it's easy to
// find and delete later from Admin -> Gallery once you're done testing.
// Run manually:  node apps/api/scripts/seed-pagination-test-data.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { db } from '../src/lib/db.js'
import { uniqueSlug } from '../src/lib/slug.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(import.meta.dirname, '../uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const COLORS = ['#8e1f22', '#a8863d', '#3b5f6b', '#5a4b8c', '#2e6b4f', '#a85a3d']

async function placeholderPhoto(label) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const svg = `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="900" fill="${color}"/>
    <text x="600" y="470" font-family="Georgia,serif" font-size="90" fill="white" text-anchor="middle" font-weight="bold">${label}</text>
  </svg>`
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`
  const dest = path.join(UPLOAD_DIR, name)
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(dest)
  return `/uploads/${name}`
}

async function main() {
  const admin = await db.user.findFirst({ where: { role: 'admin' }, orderBy: { id: 'asc' } })
  if (!admin) throw new Error('No admin user found.')

  let category = await db.galleryCategory.findFirst({ where: { name: 'Pagination Test' } })
  if (!category) {
    category = await db.galleryCategory.create({
      data: { name: 'Pagination Test', slug: await uniqueSlug('galleryCategory', 'Pagination Test'), status: true },
    })
    console.log('created category: Pagination Test')
  }

  const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000)

  let firstAlbumId = null
  for (let i = 1; i <= 15; i++) {
    const title = `Pagination Test Album ${i}`
    const exists = await db.galleryAlbum.findFirst({ where: { title } })
    if (exists) { if (i === 1) firstAlbumId = exists.id; continue }
    const cover = await placeholderPhoto(`Album ${i}`)
    const album = await db.galleryAlbum.create({
      data: {
        title,
        slug: await uniqueSlug('galleryAlbum', title),
        status: true,
        coverImage: cover,
        publishedAt: daysAgo(i),
        categoryId: category.id,
        createdBy: admin.id,
      },
    })
    if (i === 1) firstAlbumId = album.id
    console.log('created album:', title)
  }

  const existingPhotos = await db.galleryPhoto.count({ where: { albumId: firstAlbumId } })
  if (existingPhotos === 0) {
    for (let i = 1; i <= 25; i++) {
      const file = await placeholderPhoto(`Photo ${i}`)
      await db.galleryPhoto.create({
        data: { albumId: firstAlbumId, file, caption: `Test photo ${i} of 25`, sortOrder: i },
      })
    }
    console.log('added 25 photos to Pagination Test Album 1')
  } else {
    console.log('Pagination Test Album 1 already has photos — skipping')
  }

  console.log('Done. Category: /gallery/pagination-test — delete via Admin -> Gallery when finished testing.')
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
