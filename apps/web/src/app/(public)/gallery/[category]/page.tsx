import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, NotFoundError, type GalleryAlbumCard, type GalleryCategoryChild } from '@/lib/api'
import { AlbumCard } from '@/components/public/GalleryAlbumCard'
import { Pagination } from '@/components/public/Pagination'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

export const revalidate = 300

type AlbumList = {
  category: { name: string; slug: string; description: string | null; parent: { name: string; slug: string } | null }
  children: GalleryCategoryChild[]
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
      <Breadcrumbs
        items={[
          { label: 'Gallery', href: '/gallery' },
          ...(list.category.parent ? [{ label: list.category.parent.name, href: `/gallery/${list.category.parent.slug}` }] : []),
          { label: list.category.name },
        ]}
      />

      <div className="rise rounded-lg bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <h1 className="headline text-3xl md:text-5xl">
          {list.category.name}
          <span className="text-gold">.</span>
        </h1>
        {list.category.description && <p className="mt-2 text-sm text-paper/60">{list.category.description}</p>}
      </div>

      {list.children.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {list.children.map((c) => (
            <Link key={c.id} href={`/gallery/${c.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm font-medium hover:border-accent hover:text-accent">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-9">
        {list.albums.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-20 text-center">
            <p className="headline text-2xl text-ink-soft">No albums yet</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {list.albums.map((a) => <AlbumCard key={a.id} album={a} showCategory={list.children.length > 0} />)}
          </div>
        )}
        <Pagination page={list.page} pages={list.pages} base={`/gallery/${list.category.slug}`} />
      </div>
    </div>
  )
}
