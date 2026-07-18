import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, NotFoundError, type GalleryAlbumCard } from '@/lib/api'
import { AlbumCard } from '@/components/public/GalleryAlbumCard'
import { Pagination } from '@/components/public/Pagination'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

export const revalidate = 300

type AlbumList = {
  category: { name: string; slug: string }
  albums: GalleryAlbumCard[]
  total: number
  page: number
  pages: number
}

async function getList(category: string, page: string) {
  try {
    return await api<AlbumList>(`/gallery/${encodeURIComponent(category)}?page=${page}`, 300)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const list = await getList(category, '1')
  if (!list) return {}
  return { title: list.category.name }
}

export default async function GalleryCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { category } = await params
  const { page = '1' } = await searchParams
  const list = await getList(category, page)
  if (!list) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Gallery', href: '/gallery' }, { label: list.category.name }]} />

      <div className="rise rounded-lg bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <h1 className="headline text-3xl md:text-5xl">
          {list.category.name}
          <span className="text-gold">.</span>
        </h1>
      </div>

      <div className="mt-9">
        {list.albums.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-20 text-center">
            <p className="headline text-2xl text-ink-soft">No albums yet</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {list.albums.map((a) => <AlbumCard key={a.id} album={a} categorySlug={list.category.slug} />)}
          </div>
        )}
        <Pagination page={list.page} pages={list.pages} base={`/gallery/${list.category.slug}`} />
      </div>
    </div>
  )
}
