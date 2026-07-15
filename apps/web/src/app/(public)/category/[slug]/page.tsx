import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, NotFoundError } from '@/lib/api'
import { ListingPage, type PostList } from '@/components/public/ListingPage'

export const revalidate = 3600

type Cat = { name: string; slug: string; description: string | null }

async function getCategory(slug: string) {
  try {
    return await api<Cat>(`/categories/${encodeURIComponent(slug)}`, 3600)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const cat = await getCategory(slug)
  if (!cat) return {}
  return {
    title: cat.name,
    description: cat.description || `${cat.name} — Latest News`,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/category/${cat.slug}` },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page = '1' } = await searchParams
  const cat = await getCategory(slug)
  if (!cat) notFound()
  const list = await api<PostList>(`/posts?category=${encodeURIComponent(slug)}&page=${page}`, 300)

  return (
    <ListingPage
      title={cat.name}
      subtitle={cat.description || undefined}
      list={list}
      base={`/category/${slug}`}
    />
  )
}
