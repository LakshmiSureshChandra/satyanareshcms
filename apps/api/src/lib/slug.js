import transliterate from 'any-ascii'
import { db } from './db.js'

export function slugify(text) {
  return transliterate(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200) || 'post'
}

// unique slug across posts incl. trashed (mirrors reference behavior)
export async function uniqueSlug(model, text, ignoreId = null) {
  const base = slugify(text)
  let slug = base
  for (let n = 2; ; n++) {
    const existing = await db[model].findUnique({ where: { slug } })
    if (!existing || existing.id === ignoreId) return slug
    slug = `${base}-${n}`
  }
}
