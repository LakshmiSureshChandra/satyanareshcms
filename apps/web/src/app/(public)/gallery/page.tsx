import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { api, imageUrl, NotFoundError, type GalleryCategoryCard } from '@/lib/api'
import { PageHeader } from '@/components/public/PageHeader'
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
    <>
      <PageHeader eyebrow="Practice" title="Gallery" crumbs={[{ label: 'Gallery' }]}>
        <GallerySearchBox />
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-20 text-center">
            <p className="headline text-2xl text-ink-soft">No albums yet</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const src = imageUrl(c.coverImage)
              return (
                <article key={c.id} className="card-zoom group">
                  <Link href={`/gallery/${c.slug}`} className="block">
                    <div className="card-img relative aspect-4/3 w-full rounded-xl border border-line bg-paper-2">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={c.name} loading="lazy" className="absolute inset-0 size-full rounded-xl object-cover" />
                      ) : (
                        <div className="grid-bg absolute inset-0 flex items-center justify-center rounded-xl">
                          <span className="headline select-none text-5xl text-ink/10">AK</span>
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/55 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                        {c.albumCount} album{c.albumCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </Link>
                  <div className="pt-4">
                    <Link href={`/gallery/${c.slug}`}>
                      <h3 className="headline text-lg leading-snug transition-colors group-hover:text-accent">{c.name}</h3>
                    </Link>
                    {c.children.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {c.children.map((child) => (
                          <Link key={child.id} href={`/gallery/${child.slug}`} className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent-dark hover:text-accent">
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
    </>
  )
}
