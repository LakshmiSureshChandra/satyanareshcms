import Link from 'next/link'
import { imageUrl, type PostCard as PostCardType } from '@/lib/api'
import { cn } from '@/lib/utils'

// Always rendered in IST regardless of the server's or visitor's own timezone.
export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })
}

// Date + time — used on the article byline where the exact publish time matters.
export function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
  })
}

export function CategoryTag({ cat, onImage = false }: { cat: { id: number; name: string; slug: string }; onImage?: boolean }) {
  return (
    <Link
      href={`/category/${cat.slug}`}
      className={
        onImage
          ? 'inline-block rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm hover:border-accent'
          : 'kicker hover:underline'
      }
    >
      {cat.name}
    </Link>
  )
}

export function CardImage({
  post,
  className = 'aspect-[16/10]',
  rounded = 'rounded-xl',
}: {
  post: PostCardType
  className?: string
  rounded?: string
}) {
  const src = imageUrl(post.bannerImage)
  return (
    <div className={cn('card-img relative w-full border border-line bg-paper-2', className, rounded)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={post.title} loading="lazy" className={cn('absolute inset-0 size-full object-cover', rounded)} />
      ) : (
        <div className={cn('grid-bg absolute inset-0 flex items-center justify-center', rounded)}>
          <span className="headline select-none text-5xl text-ink/10">AK</span>
        </div>
      )}
    </div>
  )
}

export function PostCard({ post, big = false }: { post: PostCardType; big?: boolean }) {
  return (
    <article className="card-zoom group">
      <Link href={`/${post.slug}`} className="block">
        <CardImage post={post} className={big ? 'aspect-[16/9]' : 'aspect-[16/10]'} />
      </Link>
      <div className="pt-4">
        {post.categories[0] && <CategoryTag cat={post.categories[0]} />}
        <Link href={`/${post.slug}`}>
          <h3
            className={cn(
              'headline mt-2 line-clamp-3 transition-colors group-hover:text-accent',
              big ? 'text-2xl md:text-3xl' : 'text-lg'
            )}
          >
            {post.title}
          </h3>
        </Link>
        {big && post.metaDescription && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-2">{post.metaDescription}</p>
        )}
        <time className="mt-2 block text-xs text-ink-soft" dateTime={post.publishedAt}>
          {formatDate(post.publishedAt)}
        </time>
      </div>
    </article>
  )
}

// Lead card: image with headline overlaid on a deep gradient.
export function OverlayCard({ post }: { post: PostCardType }) {
  return (
    <article className="card-zoom group relative">
      <Link href={`/${post.slug}`} className="block">
        <CardImage post={post} className="aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/11]" rounded="rounded-2xl" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          {post.categories[0] && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
              {post.categories[0].name}
            </span>
          )}
          <h2 className="headline mt-2 text-2xl leading-snug text-white md:text-4xl md:leading-tight">{post.title}</h2>
          <time className="mt-3 block text-xs text-white/60">{formatDate(post.publishedAt)}</time>
        </div>
      </Link>
    </article>
  )
}

export function PostRow({ post }: { post: PostCardType }) {
  return (
    <article className="card-zoom group flex gap-4">
      <Link href={`/${post.slug}`} className="w-24 shrink-0 md:w-28">
        <CardImage post={post} className="aspect-square" rounded="rounded-lg" />
      </Link>
      <div className="min-w-0">
        {post.categories[0] && <CategoryTag cat={post.categories[0]} />}
        <Link href={`/${post.slug}`}>
          <h3 className="headline mt-1 line-clamp-2 text-[0.95rem] leading-snug transition-colors group-hover:text-accent">
            {post.title}
          </h3>
        </Link>
        <time className="mt-1.5 block text-xs text-ink-soft">{formatDate(post.publishedAt)}</time>
      </div>
    </article>
  )
}
