import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, imageUrl, NotFoundError } from '@/lib/api'

export const revalidate = 3600

type Page = {
  title: string
  slug: string
  content: string
  bannerImage: string | null
  metaTitle: string | null
  metaDescription: string | null
}

async function getPage(slug: string) {
  try {
    return await api<Page>(`/pages/${encodeURIComponent(slug)}`, 3600)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/page/${page.slug}` },
  }
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()
  const banner = imageUrl(page.bannerImage)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rule-double pt-3">
        <h1 className="headline text-3xl">{page.title}<span className="text-accent">.</span></h1>
      </div>
      {banner && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner} alt={page.title} className="mt-6 w-full rounded-md" />
      )}
      <div className="prose-news mt-4" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  )
}
