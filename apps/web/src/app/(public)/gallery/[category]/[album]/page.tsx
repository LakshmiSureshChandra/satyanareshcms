import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, imageUrl, NotFoundError, type GalleryAlbum } from '@/lib/api'
import { formatDate } from '@/components/public/PostCard'
import { Pagination } from '@/components/public/Pagination'
import { PageHeader } from '@/components/public/PageHeader'
import { GallerySearchBox } from '@/components/public/GallerySearchBox'
import { AlbumCard } from '@/components/public/GalleryAlbumCard'

export const revalidate = 3600

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function getAlbum(category: string, album: string, page: string) {
  try {
    return await api<GalleryAlbum>(`/gallery/${encodeURIComponent(category)}/${encodeURIComponent(album)}?page=${page}`, 3600)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; album: string }>
}): Promise<Metadata> {
  const { category, album } = await params
  const a = await getAlbum(category, album, '1')
  if (!a) return {}
  const cover = imageUrl(a.coverImage)
  return {
    title: a.title,
    alternates: { canonical: `${SITE}/gallery/${a.category.slug}/${a.slug}` },
    openGraph: { title: a.title, type: 'article', images: cover ? [{ url: cover }] : undefined },
  }
}

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; album: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { category, album } = await params
  const { page = '1' } = await searchParams
  const a = await getAlbum(category, album, page)
  if (!a) notFound()

  const base = `/gallery/${a.category.slug}/${a.slug}`

  return (
    <>
      <PageHeader
        eyebrow="Album"
        title={a.title}
        subtitle={`${formatDate(a.publishedAt)} · ${a.totalPhotos} photo${a.totalPhotos === 1 ? '' : 's'}`}
        crumbs={[
          { label: 'Gallery', href: '/gallery' },
          ...(a.category.parent ? [{ label: a.category.parent.name, href: `/gallery/${a.category.parent.slug}` }] : []),
          { label: a.category.name, href: `/gallery/${a.category.slug}` },
          { label: a.title },
        ]}
      >
        <GallerySearchBox />
      </PageHeader>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Pagination page={a.photoPage} pages={a.photoPages} base={base} className="mb-8" />

      <div className="space-y-10">
        {a.photos.map((p) => (
          <figure key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(p.file) || ''} alt={p.caption || a.title} className="w-full rounded-2xl border border-line" />
            {p.caption && <figcaption className="mt-3 text-center text-sm text-ink-soft">{p.caption}</figcaption>}
          </figure>
        ))}
        {!a.photos.length && (
          <p className="py-16 text-center text-sm text-ink-soft">No photos in this album yet.</p>
        )}
      </div>

      <Pagination page={a.photoPage} pages={a.photoPages} base={base} />

      {a.related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="headline text-2xl">Related albums</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            {a.related.map((r) => <AlbumCard key={r.id} album={r} />)}
          </div>
        </section>
      )}
      </div>
    </>
  )
}
