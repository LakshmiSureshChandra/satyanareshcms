import Link from 'next/link'
import { imageUrl, type GalleryAlbumCard } from '@/lib/api'
import { formatDate } from './PostCard'

export function AlbumCard({ album }: { album: GalleryAlbumCard }) {
  const src = imageUrl(album.coverImage)
  return (
    <article className="card-zoom group">
      <Link href={`/gallery/${album.slug}`} className="block">
        <div className="card-img relative aspect-[4/3] w-full rounded-md bg-paper-2">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={album.title} loading="lazy" className="absolute inset-0 h-full w-full rounded-md object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center rounded-md">
              <span className="headline text-5xl text-ink/8 select-none">A</span>
            </div>
          )}
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            {album.photoCount} photo{album.photoCount === 1 ? '' : 's'}
          </span>
        </div>
      </Link>
      <div className="pt-3.5">
        <Link href={`/gallery/${album.slug}`}>
          <h3 className="headline text-lg leading-snug transition-colors group-hover:text-accent">{album.title}</h3>
        </Link>
        <time className="mt-1.5 block text-xs text-ink-soft">{formatDate(album.publishedAt)}</time>
      </div>
    </article>
  )
}
