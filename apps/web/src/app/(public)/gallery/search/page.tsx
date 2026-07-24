import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, NotFoundError, type GalleryAlbumSearch } from '@/lib/api'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { GallerySearchBox } from '@/components/public/GallerySearchBox'
import { Pagination } from '@/components/public/Pagination'
import { AlbumCard } from '@/components/public/GalleryAlbumCard'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Search Gallery' }

async function getResults(s: string, page: string) {
  try {
    return await api<GalleryAlbumSearch>(`/gallery/search?s=${encodeURIComponent(s)}&page=${page}`, false)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
}

export default async function GallerySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; page?: string }>
}) {
  const { s = '', page = '1' } = await searchParams
  const result = s.trim()
    ? await getResults(s, page)
    : { albums: [], total: 0, page: 1, pages: 0, query: '' }
  if (!result) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Gallery', href: '/gallery' }, { label: 'Search' }]} />

      <div className="rise rounded-lg bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <h1 className="headline text-3xl md:text-5xl">
          Search Gallery
          <span className="text-gold">.</span>
        </h1>
        <GallerySearchBox defaultValue={s} />
      </div>

      <div className="mt-9">
        {!s.trim() ? (
          <p className="py-10 text-center text-sm text-ink-soft">Enter a search term above.</p>
        ) : result.albums.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-20 text-center">
            <p className="headline text-2xl text-ink-soft">No albums found for &quot;{s}&quot;</p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-ink-soft">{result.total} result{result.total === 1 ? '' : 's'} for &quot;{s}&quot;</p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {result.albums.map((a) => <AlbumCard key={a.id} album={a} showCategory />)}
            </div>
          </>
        )}
        <Pagination page={result.page} pages={result.pages} base={`/gallery/search?s=${encodeURIComponent(s)}`} />
      </div>
    </div>
  )
}
