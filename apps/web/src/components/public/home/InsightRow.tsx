import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { type PostCard as PostCardType } from '@/lib/api'
import { CardImage, CategoryTag, formatDate } from '../PostCard'

// A compact, text-forward list row — the homepage "Insights" section used to
// be a big-image news grid (lead photo + 2x2 card grid), which read like a
// news portal rather than an advisory firm. This mirrors how professional
// services firms present resources: small thumbnail, category, headline,
// date, nothing louder than the copy itself.
export function InsightRow({ post }: { post: PostCardType }) {
  return (
    <Link href={`/${post.slug}`} className="group flex items-center gap-5 py-5 first:pt-0 last:pb-0">
      <div className="w-20 shrink-0 sm:w-24">
        <CardImage post={post} className="aspect-square" rounded="rounded-xl" />
      </div>
      <div className="min-w-0 flex-1">
        {post.categories[0] && <CategoryTag cat={post.categories[0]} />}
        <h3 className="headline mt-1.5 line-clamp-2 text-base leading-snug transition-colors group-hover:text-accent sm:text-lg">
          {post.title}
        </h3>
        <time className="mt-1.5 block text-xs text-ink-soft" dateTime={post.publishedAt}>
          {formatDate(post.publishedAt)}
        </time>
      </div>
      <ChevronRight className="hidden size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-accent sm:block" />
    </Link>
  )
}
