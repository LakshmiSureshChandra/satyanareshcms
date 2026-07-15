import Link from 'next/link'
import { imageUrl, type PostCard as PostCardType } from '@/lib/api'

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Editorial kicker: small-caps category label. On images it sits on a white plate.
export function CategoryTag({ cat, onImage = false }: { cat: { id: number; name: string; slug: string }; onImage?: boolean }) {
  return (
    <Link
      href={`/category/${cat.slug}`}
      className={
        onImage
          ? 'inline-block bg-paper px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink hover:text-accent'
          : 'kicker hover:underline'
      }
    >
      {cat.name}
    </Link>
  )
}

export function CardImage({ post, className = 'aspect-[16/10]', rounded = 'rounded-md' }: { post: PostCardType; className?: string; rounded?: string }) {
  const src = imageUrl(post.bannerImage)
  return (
    <div className={`card-img relative ${className} w-full bg-paper-2 ${rounded}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={post.title} loading="lazy" className={`absolute inset-0 h-full w-full object-cover ${rounded}`} />
      ) : (
        <div className={`absolute inset-0 flex items-center justify-center ${rounded}`}>
          <span className="headline text-5xl text-ink/8 select-none">A</span>
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
      <div className="pt-3.5">
        {post.categories[0] && <CategoryTag cat={post.categories[0]} />}
        <Link href={`/${post.slug}`}>
          <h3 className={`headline mt-1.5 transition-colors group-hover:text-accent ${big ? 'text-2xl md:text-3xl' : 'text-lg'} line-clamp-3`}>
            {post.title}
          </h3>
        </Link>
        <time className="mt-1.5 block text-xs text-ink-soft" dateTime={post.publishedAt}>
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
        <CardImage post={post} className="aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/11]" rounded="rounded-lg" />
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          {post.categories[0] && (
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
              {post.categories[0].name}
            </span>
          )}
          <h2 className="headline mt-2 text-2xl leading-snug text-white md:text-4xl md:leading-snug">
            {post.title}
          </h2>
          <time className="mt-2.5 block text-xs text-white/60">{formatDate(post.publishedAt)}</time>
        </div>
      </Link>
    </article>
  )
}

export function PostRow({ post }: { post: PostCardType }) {
  return (
    <article className="card-zoom group flex gap-4">
      <Link href={`/${post.slug}`} className="w-28 shrink-0 md:w-32">
        <CardImage post={post} className="aspect-square md:aspect-[4/3]" rounded="rounded-md" />
      </Link>
      <div className="min-w-0">
        {post.categories[0] && <CategoryTag cat={post.categories[0]} />}
        <Link href={`/${post.slug}`}>
          <h3 className="headline mt-1 text-[0.95rem] leading-snug line-clamp-2 transition-colors group-hover:text-accent">
            {post.title}
          </h3>
        </Link>
        <time className="mt-1 block text-xs text-ink-soft">{formatDate(post.publishedAt)}</time>
      </div>
    </article>
  )
}
