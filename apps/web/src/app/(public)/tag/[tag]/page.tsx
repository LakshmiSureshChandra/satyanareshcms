import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { ListingPage, type PostList } from '@/components/public/ListingPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params
  return { title: `#${decodeURIComponent(tag)}` }
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { tag } = await params
  const { page = '1' } = await searchParams
  const decoded = decodeURIComponent(tag)
  const list = await api<PostList>(`/posts?tag=${encodeURIComponent(decoded)}&page=${page}`, false)

  return <ListingPage title={`#${decoded}`} list={list} base={`/tag/${tag}`} />
}
