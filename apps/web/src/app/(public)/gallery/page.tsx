import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, NotFoundError, type GalleryAlbumCard } from '@/lib/api'
import { AlbumCard } from '@/components/public/GalleryAlbumCard'
import { Pagination } from '@/components/public/Pagination'

export const revalidate = 300
export const metadata: Metadata = { title: 'Gallery' }

type AlbumList = { albums: GalleryAlbumCard[]; total: number; page: number; pages: number }

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page = '1' } = await searchParams
  let list: AlbumList
  try {
    list = await api<AlbumList>(`/gallery?page=${page}`, 300)
  } catch (e) {
    if (e instanceof NotFoundError) notFound()
    throw e
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rise rounded-lg bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <h1 className="headline text-3xl md:text-5xl">
          Gallery
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
            {list.albums.map((a) => <AlbumCard key={a.id} album={a} />)}
          </div>
        )}
        <Pagination page={list.page} pages={list.pages} base="/gallery" />
      </div>
    </div>
  )
}
