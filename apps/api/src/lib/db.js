import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()

// Soft-delete helpers: all list/read queries must add notTrashed
export const notTrashed = { deletedAt: null }

// evaluated per-request so publishedAt <= now stays current
export const publishedNow = () => ({
  ...notTrashed,
  status: true,
  publishedAt: { not: null, lte: new Date() },
})
