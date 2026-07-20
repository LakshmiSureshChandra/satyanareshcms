// One-time: attaches real (freely-licensed, Wikimedia Commons) photos to the
// English CA demo content from seed-demo-content.mjs, purely for client
// presentation. Run manually:
//   node apps/api/scripts/attach-demo-images.mjs
//
// Safe to re-run: only fills in a bannerImage/coverImage/photo set that is
// currently empty, so it will never overwrite a real photo someone uploaded
// through the admin panel.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { db } from '../src/lib/db.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(import.meta.dirname, '../uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// source: Wikimedia Commons, freely licensed, no logos/brands/identifiable people
const IMG = {
  contract: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Legal_Contract_%26_Signature_-_Warm_Tones.jpg',
  officeTower: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Vista_desde_abajo_del_exterior_de_un_moderno_edificio_de_oficinas.jpg',
  coworkingLounge: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Coworking_Space_in_Columbus_Ohio.jpg',
  meetingRoom: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Chairs_in_a_meeting_room_%28Unsplash%29.jpg',
  magnifyingGlass: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Magnifying_glass_on_antique_table.jpg',
  rupee1: 'https://upload.wikimedia.org/wikipedia/commons/8/89/2018_%28%E2%82%B91%29_Indian_1_Rupee_Note%2C_Jamshedpur%2C_Jharkhand_%28_Ank_Kumar%2C_Infosys_Limited_%29_02.jpg',
  rupee2000: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Both_sides_of_%E2%82%B92%2C000_Indian_rupee_bank_note.jpg',
  seminar1: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Audience_-_Saroj_Ghose_Address_-_Strategic_Transformations_-_Museums_in_21st_Century_-_International_Conference_and_Seminar_-_Kolkata_2014-02-14_3013.JPG',
  seminar2: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Audience_-_Saroj_Ghose_Address_-_Strategic_Transformations_-_Museums_in_21st_Century_-_International_Conference_and_Seminar_-_Kolkata_2014-02-14_3017.JPG',
  seminar3: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Audience_-_Saroj_Ghose_Address_-_Strategic_Transformations_-_Museums_in_21st_Century_-_International_Conference_and_Seminar_-_Kolkata_2014-02-14_3018.JPG',
}

const downloadCache = new Map()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchWithRetry(url, attempts = 7) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'akganesh-demo-content/1.0 (one-time demo image import)' } })
    if (res.ok) return res
    if (res.status === 429 && i < attempts - 1) {
      const wait = 15000 * (i + 1)
      console.log(`  rate-limited, waiting ${wait / 1000}s...`)
      await sleep(wait)
      continue
    }
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
}

async function fetchAndSave(url, { maxWidth = 1800 } = {}) {
  if (downloadCache.has(url)) return downloadCache.get(url)
  await sleep(4000) // be a polite, slow client — this only ever runs once
  const res = await fetchWithRetry(url)
  const buffer = Buffer.from(await res.arrayBuffer())
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`
  const dest = path.join(UPLOAD_DIR, name)
  await sharp(buffer).rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 82 }).toFile(dest)
  const publicPath = `/uploads/${name}`
  downloadCache.set(url, publicPath)
  console.log('  fetched', url.split('/').pop(), '->', publicPath)
  return publicPath
}

async function setPostBanner(title, url) {
  const post = await db.post.findFirst({ where: { title } })
  if (!post) { console.log('skip (not found):', title); return }
  if (post.bannerImage) { console.log('skip (already has image):', title); return }
  const bannerImage = await fetchAndSave(url)
  await db.post.update({ where: { id: post.id }, data: { bannerImage } })
  console.log('set banner:', title)
}

async function setAlbumCoverAndPhotos(title, coverUrl, photoSpecs) {
  const album = await db.galleryAlbum.findFirst({ where: { title } })
  if (!album) { console.log('skip (not found):', title); return }

  if (!album.coverImage) {
    const coverImage = await fetchAndSave(coverUrl)
    await db.galleryAlbum.update({ where: { id: album.id }, data: { coverImage } })
    console.log('set cover:', title)
  }

  const existingPhotos = await db.galleryPhoto.count({ where: { albumId: album.id } })
  if (existingPhotos > 0) { console.log('skip photos (already has some):', title); return }

  let sortOrder = 0
  for (const { url, caption } of photoSpecs) {
    const file = await fetchAndSave(url, { maxWidth: 2000 })
    await db.galleryPhoto.create({ data: { albumId: album.id, file, caption, sortOrder: sortOrder++ } })
  }
  console.log('added', photoSpecs.length, 'photos:', title)
}

async function main() {
  console.log('-- posts --')
  await setPostBanner('Key Changes in Income Tax Filing This Year', IMG.rupee1)
  await setPostBanner('Understanding Advance Tax Payment Deadlines', IMG.rupee2000)
  await setPostBanner('Common Mistakes to Avoid While Filing Tax Returns', IMG.contract)

  await setPostBanner('Monthly GST Return Filing — What Businesses Need to Know', IMG.contract)
  await setPostBanner('Input Tax Credit Reconciliation Best Practices', IMG.magnifyingGlass)
  await setPostBanner('E-Invoicing Requirements for Growing Businesses', IMG.meetingRoom)

  await setPostBanner('Preparing Your Business for the Annual Statutory Audit', IMG.magnifyingGlass)
  await setPostBanner('The Role of Internal Controls in Reducing Audit Findings', IMG.officeTower)
  await setPostBanner('Understanding Different Types of Assurance Engagements', IMG.contract)

  await setPostBanner('Annual ROC Filing Checklist for Private Companies', IMG.officeTower)
  await setPostBanner('Director KYC and Other Recurring Compliance Requirements', IMG.contract)
  await setPostBanner('Board Meeting and Resolution Documentation Best Practices', IMG.meetingRoom)

  await setPostBanner('Building a Tax-Efficient Investment Strategy', IMG.rupee2000)
  await setPostBanner('Retirement Planning for Business Owners and Professionals', IMG.magnifyingGlass)
  await setPostBanner('Cash Flow Management Tips for Small Businesses', IMG.rupee1)

  console.log('-- gallery --')
  await setAlbumCoverAndPhotos('Annual Day 2026', IMG.coworkingLounge, [
    { url: IMG.coworkingLounge, caption: 'The office lounge set up for our Annual Day celebrations.' },
    { url: IMG.meetingRoom, caption: 'A quieter corner during the event.' },
  ])
  await setAlbumCoverAndPhotos('Office Anniversary Celebration', IMG.meetingRoom, [
    { url: IMG.meetingRoom, caption: 'Team members gathered for the anniversary celebration.' },
    { url: IMG.coworkingLounge, caption: 'Refreshments and conversation after the formalities.' },
  ])
  await setAlbumCoverAndPhotos('Tax Awareness Seminar', IMG.seminar1, [
    { url: IMG.seminar1, caption: 'Attendees at our tax awareness seminar.' },
    { url: IMG.seminar2, caption: 'A packed session on the latest filing changes.' },
  ])
  await setAlbumCoverAndPhotos('GST Workshop for Clients', IMG.seminar3, [
    { url: IMG.seminar3, caption: 'Clients attending our GST compliance workshop.' },
  ])

  console.log('Done.')
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
