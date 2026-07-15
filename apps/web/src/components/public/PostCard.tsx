import Link from 'next/link'
import { imageUrl, type PostCard as PostCardType } from '@/lib/api'

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('te-IN', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Deterministic vivid chip color per category — lively palette, consistent per category.
const CHIP_COLORS = [
  'bg-orange-600', 'bg-violet-600', 'bg-teal-600', 'bg-rose-600', 'bg-blue-600', 'bg-amber-600',
]
export function chipColor(id: number) {
  return CHIP_COLORS[id % CHIP_COLORS.length]
}

export function CategoryTag({ cat, onImage = false }: { cat: { id: number; name: string; slug: string }; onImage?: boolean }) {
  return (
    <Link
      href={`/category/${cat.slug}`}
      className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-white transition-transform hover:scale-105 ${chipColor(cat.id)} ${onImage ? 'shadow-md' : ''}`}
    >
      {cat.name}
    </Link>
  )
}

export function CardImage({ post, className = 'aspect-[16/10]', rounded = 'rounded-2xl' }: { post: PostCardType; className?: string; rounded?: string }) {
  const src = imageUrl(post.bannerImage)
  return (
    <div className={`card-img relative ${className} w-full bg-paper-2 ${rounded}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={post.title} loading="lazy" className={`absolute inset-0 h-full w-full object-cover ${rounded}`} />
      ) : (
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-paper-2 to-line ${rounded}`}>
          <span className="headline text-5xl text-ink/10 select-none">తె</span>
        </div>
      )}
    </div>
  )
}

export function PostCard({ post, big = false }: { post: PostCardType; big?: boolean }) {
  return (
    <article className="card-zoom group">
      <div className="relative">
        <Link href={`/${post.slug}`} className="block">
          <CardImage post={post} className={big ? 'aspect-[16/9]' : 'aspect-[16/10]'} />
        </Link>
        {post.categories[0] && (
          <span className="absolute left-3 top-3">
            <CategoryTag cat={post.categories[0]} onImage />
          </span>
        )}
      </div>
      <div className="pt-3">
        <Link href={`/${post.slug}`}>
          <h3 className={`headline transition-colors group-hover:text-accent ${big ? 'text-2xl md:text-3xl' : 'text-lg'} line-clamp-3`}>
            {post.title}
          </h3>
        </Link>
        <time className="mt-1 block text-xs font-medium text-ink-soft" dateTime={post.publishedAt}>
          {formatDate(post.publishedAt)}
        </time>
      </div>
    </article>
  )
}

// Big image card with headline overlaid — hero / feature slots.
export function OverlayCard({ post }: { post: PostCardType }) {
  return (
    <article className="card-zoom group relative">
      <Link href={`/${post.slug}`} className="block">
        <CardImage post={post} className="aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/11]" rounded="rounded-3xl" />
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 pb-14 md:p-7 md:pb-16">
          <h2 className="headline text-2xl leading-snug text-white drop-shadow md:text-4xl">
            {post.title}
          </h2>
          <time className="mt-2 block text-xs font-medium text-white/70">{formatDate(post.publishedAt)}</time>
        </div>
      </Link>
      {post.categories[0] && (
        <span className="absolute left-5 top-5 md:left-7 md:top-7">
          <CategoryTag cat={post.categories[0]} onImage />
        </span>
      )}
    </article>
  )
}

export function PostRow({ post }: { post: PostCardType }) {
  return (
    <article className="card-zoom group flex gap-4">
      <Link href={`/${post.slug}`} className="w-28 shrink-0 md:w-36">
        <CardImage post={post} className="aspect-square md:aspect-[4/3]" rounded="rounded-xl" />
      </Link>
      <div className="min-w-0">
        {post.categories[0] && <CategoryTag cat={post.categories[0]} />}
        <Link href={`/${post.slug}`}>
          <h3 className="headline mt-1.5 text-base leading-snug line-clamp-2 transition-colors group-hover:text-accent">
            {post.title}
          </h3>
        </Link>
        <time className="mt-1 block text-xs font-medium text-ink-soft">{formatDate(post.publishedAt)}</time>
      </div>
    </article>
  )
}
