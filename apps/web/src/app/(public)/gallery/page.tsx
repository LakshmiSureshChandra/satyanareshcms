import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { api, imageUrl, NotFoundError, type GalleryCategoryCard } from '@/lib/api'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { GallerySearchBox } from '@/components/public/GallerySearchBox'

export const revalidate = 300
export const metadata: Metadata = { title: 'Gallery' }

export default async function GalleryPage() {
  let categories: GalleryCategoryCard[]
  try {
    categories = await api<GalleryCategoryCard[]>('/gallery', 300)
  } catch (e) {
    if (e instanceof NotFoundError) notFound()
    throw e
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Gallery' }]} />

      <div className="rise rounded-lg bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <h1 className="headline text-3xl md:text-5xl">
          Gallery
          <span className="text-gold">.</span>
        </h1>
        <GallerySearchBox />
      </div>

      <div className="mt-9">
        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-20 text-center">
            <p className="headline text-2xl text-ink-soft">No albums yet</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const src = imageUrl(c.coverImage)
              return (
                <article key={c.id} className="card-zoom group">
                  <Link href={`/gallery/${c.slug}`} className="block">
                    <div className="card-img relative aspect-[4/3] w-full rounded-md bg-paper-2">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full rounded-md object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center rounded-md">
                          <span className="headline text-5xl text-ink/8 select-none">G</span>
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                        {c.albumCount} album{c.albumCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </Link>
                  <div className="pt-3.5">
                    <Link href={`/gallery/${c.slug}`}>
                      <h3 className="headline text-lg leading-snug transition-colors group-hover:text-accent">{c.name}</h3>
                    </Link>
                    {c.children.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.children.map((child) => (
                          <Link key={child.id} href={`/gallery/${child.slug}`} className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-ink-soft hover:border-accent hover:text-accent">
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
