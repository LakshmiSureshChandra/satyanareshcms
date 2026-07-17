import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, imageUrl, NotFoundError, type GalleryAlbum } from '@/lib/api'
import { formatDate } from '@/components/public/PostCard'

export const revalidate = 3600

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function getAlbum(slug: string) {
  try {
    return await api<GalleryAlbum>(`/gallery/${encodeURIComponent(slug)}`, 3600)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const album = await getAlbum(slug)
  if (!album) return {}
  const cover = imageUrl(album.coverImage)
  return {
    title: album.title,
    alternates: { canonical: `${SITE}/gallery/${album.slug}` },
    openGraph: { title: album.title, type: 'article', images: cover ? [{ url: cover }] : undefined },
  }
}

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const album = await getAlbum(slug)
  if (!album) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span>›</span>
        <Link href="/gallery" className="hover:text-accent">Gallery</Link>
      </nav>

      <h1 className="headline text-3xl leading-snug md:text-4xl">{album.title}</h1>
      <div className="mt-3 flex items-center gap-3 border-y border-line py-3 text-sm text-ink-soft">
        <time>{formatDate(album.publishedAt)}</time>
        <span className="text-line">|</span>
        <span>{album.photos.length} photo{album.photos.length === 1 ? '' : 's'}</span>
      </div>

      {/* photos listed one below the other */}
      <div className="mt-8 space-y-8">
        {album.photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={imageUrl(p.file) || ''} alt={p.caption || album.title} className="w-full rounded-lg" />
        ))}
        {!album.photos.length && (
          <p className="py-16 text-center text-sm text-ink-soft">No photos in this album yet.</p>
        )}
      </div>
    </div>
  )
}
