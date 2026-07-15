import Link from 'next/link'
import type { PostCard } from '@/lib/api'

// Scrolling breaking-news strip. Track is duplicated for a seamless CSS loop.
export function Ticker({ posts }: { posts: PostCard[] }) {
  if (!posts.length) return null
  const items = posts.slice(0, 8)
  const Track = () => (
    <>
      {items.map((p) => (
        <Link key={p.id} href={`/${p.slug}`} className="mx-5 inline-flex items-center gap-2 text-sm text-paper/85 hover:text-lime">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          {p.title}
        </Link>
      ))}
    </>
  )
  return (
    <div className="flex items-center overflow-hidden bg-ink">
      <span className="z-10 shrink-0 bg-lime px-3 py-1.5 font-display text-xs font-extrabold tracking-wide text-ink md:px-4">
        తాజా
      </span>
      <div className="relative flex-1 overflow-hidden py-1.5">
        <div className="ticker-track">
          <Track />
          <Track />
        </div>
      </div>
    </div>
  )
}
