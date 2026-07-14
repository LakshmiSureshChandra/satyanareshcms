import Link from 'next/link'
import { imageUrl, type PostCard as PostCardType } from '@/lib/api'

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('te-IN', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function CategoryTag({ cat }: { cat: { name: string; slug: string } }) {
  return (
    <Link
      href={`/category/${cat.slug}`}
      className="inline-block bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-accent-dark"
    >
      {cat.name}
    </Link>
  )
}

export function CardImage({ post, className = 'aspect-[16/10]' }: { post: PostCardType; className?: string }) {
  const src = imageUrl(post.bannerImage)
  return (
    <div className={`card-img relative ${className} w-full bg-paper-2`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={post.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="headline text-4xl text-line select-none">తె</span>
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
      <div className="pt-3">
        {post.categories[0] && <CategoryTag cat={post.categories[0]} />}
        <Link href={`/${post.slug}`}>
          <h3 className={`headline mt-2 group-hover:text-accent transition-colors ${big ? 'text-2xl md:text-3xl' : 'text-lg'} line-clamp-3`}>
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

export function PostRow({ post }: { post: PostCardType }) {
  return (
    <article className="card-zoom group flex gap-4">
      <Link href={`/${post.slug}`} className="w-28 shrink-0 md:w-36">
        <CardImage post={post} className="aspect-square md:aspect-[4/3]" />
      </Link>
      <div className="min-w-0">
        {post.categories[0] && <CategoryTag cat={post.categories[0]} />}
        <Link href={`/${post.slug}`}>
          <h3 className="headline mt-1.5 text-base leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {post.title}
          </h3>
        </Link>
        <time className="mt-1 block text-xs text-ink-soft">{formatDate(post.publishedAt)}</time>
      </div>
    </article>
  )
}
