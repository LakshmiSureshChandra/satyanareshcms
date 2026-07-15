import Link from 'next/link'
import type { PostCard } from '@/lib/api'

// Scrolling breaking-news strip. Track is duplicated for a seamless CSS loop.
export function Ticker({ posts }: { posts: PostCard[] }) {
  if (!posts.length) return null
  const items = posts.slice(0, 8)
  const Track = () => (
    <>
      {items.map((p) => (
        <Link key={p.id} href={`/${p.slug}`} className="mx-6 inline-flex items-center gap-2.5 text-[13px] text-paper/80 hover:text-white">
          <span className="h-1 w-1 rounded-full bg-gold" />
          {p.title}
        </Link>
      ))}
    </>
  )
  return (
    <div className="flex items-center overflow-hidden border-b border-white/10 bg-ink">
      <span className="z-10 shrink-0 bg-accent px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white md:px-5">
        తాజా వార్తలు
      </span>
      <div className="relative flex-1 overflow-hidden py-2">
        <div className="ticker-track">
          <Track />
          <Track />
        </div>
      </div>
    </div>
  )
}
