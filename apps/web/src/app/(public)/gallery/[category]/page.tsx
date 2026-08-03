import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, NotFoundError, type GalleryAlbumCard, type GalleryCategoryChild } from '@/lib/api'
import { AlbumCard } from '@/components/public/GalleryAlbumCard'
import { Pagination } from '@/components/public/Pagination'
import { PageHeader } from '@/components/public/PageHeader'
import { GallerySearchBox } from '@/components/public/GallerySearchBox'

export const revalidate = 300

type AlbumList = {
  category: { name: string; slug: string; description: string | null; parent: { name: string; slug: string } | null }
  children: GalleryCategoryChild[]
  albums: GalleryAlbumCard[]
  total: number
  page: number
  pages: number
  moreFromGallery: GalleryAlbumCard[]
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
    <>
      <PageHeader
        eyebrow="Gallery"
        title={list.category.name}
        subtitle={list.category.description || undefined}
        crumbs={[
          { label: 'Gallery', href: '/gallery' },
          ...(list.category.parent ? [{ label: list.category.parent.name, href: `/gallery/${list.category.parent.slug}` }] : []),
          { label: list.category.name },
        ]}
      >
        <GallerySearchBox />
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {list.children.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {list.children.map((c) => (
              <Link key={c.id} href={`/gallery/${c.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:border-accent-dark hover:text-accent">
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <Pagination page={list.page} pages={list.pages} base={`/gallery/${list.category.slug}`} className="mb-6" />
        {list.albums.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-20 text-center">
            <p className="headline text-2xl text-ink-soft">No albums yet</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {list.albums.map((a) => <AlbumCard key={a.id} album={a} showCategory={list.children.length > 0} />)}
          </div>
        )}
        <Pagination page={list.page} pages={list.pages} base={`/gallery/${list.category.slug}`} />

        {list.moreFromGallery.length > 0 && (
          <section className="mt-16 border-t border-line pt-10">
            <div className="flex items-end justify-between gap-4">
              <h2 className="headline min-w-0 flex-1 text-2xl">More from Gallery</h2>
              <Link href="/gallery" className="shrink-0 whitespace-nowrap text-sm font-semibold text-accent hover:underline">View all →</Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {list.moreFromGallery.map((a) => <AlbumCard key={a.id} album={a} showCategory compact />)}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
